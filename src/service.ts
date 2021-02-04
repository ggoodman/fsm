import { DisposableStore, Emitter, IDisposable } from 'ts-primitives';
import { defineCompoundState } from './builder';
import type { CompoundStateBuilder } from './types/builder';
import type { OnEnterContext, OnEventContext, OnExitContext } from './types/context';
import type { CompoundStateDefinition } from './types/definition';
import type { AnyEvent, EventWithoutData } from './types/events';
import type { AnyState, StateWithoutData } from './types/states';

enum RunState {
  Initial,
  Started,
  Finished,
  Stopped,
  Disposed,
}

export class Service<TState extends AnyState, TEvent extends AnyEvent> {
  static define<TState extends AnyState, TEvent extends AnyEvent>(
    builderFn: (builder: CompoundStateBuilder<TState, TEvent>) => void,
    initialState: StateWithoutData<TState>['id'] | TState
  ) {
    const def = defineCompoundState(builderFn);

    return new Service(
      def,
      typeof initialState === 'string' ? ({ id: initialState } as TState) : initialState
    );
  }

  private externalEventQueue: TEvent[] = [];
  private internalEventQueue: TEvent[] = [];
  private internalState: TState;
  private runState = RunState.Initial;
  private stateSequenceId = 0;
  private currentStateDisposables = new DisposableStore();
  private readonly onStateChangeEmitter = new Emitter<Readonly<TState>>();

  private constructor(
    private readonly def: CompoundStateDefinition<TState, TEvent>,
    initialState: TState
  ) {
    this.internalState = initialState;
  }

  get onStateChange() {
    return this.onStateChangeEmitter.event;
  }

  get state(): Readonly<TState> {
    return this.internalState;
  }

  dispose(stop: boolean) {
    if (stop) {
      this.stop();
    } else {
      this.internalEventQueue.length = 0;
      this.externalEventQueue.length = 0;
    }

    this.currentStateDisposables.dispose();
    this.onStateChangeEmitter.dispose();
    this.runState = RunState.Disposed;
  }

  send(event: EventWithoutData<TEvent>['id'] | TEvent) {
    if (this.runState !== RunState.Started) {
      return;
    }

    const eventObj = typeof event === 'string' ? ({ id: event } as TEvent) : event;

    // We should only initiate flushing if the queues are empty
    const shouldInitiateFlushing =
      this.externalEventQueue.length === 0 && this.internalEventQueue.length === 0;

    this.externalEventQueue.push(Object.freeze({ ...eventObj }));

    if (shouldInitiateFlushing) {
      this.flushEventQueue();
    }
  }

  start() {
    if (this.runState !== RunState.Initial) {
      return;
    }

    this.runState = RunState.Started;

    this.runCallbacks(this.def.onEnterCallbacks, () => {
      const ctx = new OnEnterContextImpl(
        this.internalState,
        undefined,
        this.sendEventInternal.bind(this),
        this.transitionTo.bind(this)
      );

      this.currentStateDisposables.add(ctx);

      return ctx;
    });

    this.handleOnEnter();
  }

  stop() {
    if (this.runState !== RunState.Started && this.runState !== RunState.Finished) {
      return;
    }

    this.handleOnExit();

    this.runCallbacks(
      this.def.onExitCallbacks,
      () => new OnExitContextImpl<TState, TEvent>(this.internalState, undefined)
    );

    this.internalEventQueue.length = 0;
    this.externalEventQueue.length = 0;
    this.runState = RunState.Stopped;
  }

  private flushEventQueue() {
    while (
      this.runState === RunState.Started &&
      (this.externalEventQueue.length || this.internalEventQueue.length)
    ) {
      while (this.runState === RunState.Started && this.internalEventQueue.length) {
        const event = this.internalEventQueue.shift()!;

        this.handleOnEvent(event);
      }

      while (this.runState === RunState.Started && this.externalEventQueue.length) {
        const event = this.externalEventQueue.shift()!;

        this.handleOnEvent(event);
      }
    }
  }

  /**
   * We entered a new state
   */
  private handleOnEnter(event?: TEvent) {
    const currentStateId: TState['id'] = this.internalState.id;
    const stateDef = this.def.states[currentStateId];

    this.runCallbacks(stateDef?.onEnterCallbacks, () => {
      const ctx = new OnEnterContextImpl(
        this.internalState,
        event,
        this.sendEventInternal.bind(this),
        this.transitionTo.bind(this)
      );

      this.currentStateDisposables.add(ctx);

      return ctx;
    });
  }

  private handleOnEvent(event: TEvent) {
    const currentStateId: TState['id'] = this.internalState.id;
    const stateDef = this.def.states[currentStateId];

    this.runCallbacks(
      [
        // We handle events from the innermost state first
        ...(stateDef?.onEventCallbacks[event.id] ?? []),
        ...(this.def.onEventCallbacks[event.id] ?? []),
      ],
      () => {
        const ctx = new OnEventContextImpl(
          this.internalState,
          event,
          this.sendEventInternal.bind(this),
          this.transitionTo.bind(this)
        );

        this.currentStateDisposables.add(ctx);

        return ctx;
      }
    );
  }

  private handleOnExit(event?: TEvent) {
    const currentStateId: TState['id'] = this.internalState.id;
    const stateDef = this.def.states[currentStateId];

    this.runCallbacks(
      stateDef?.onExitCallbacks,
      () => new OnExitContextImpl(this.internalState, event)
    );
  }

  private runCallbacks<TContext extends IDisposable>(
    callbacks: undefined | Array<(ctx: TContext) => void>,
    ctxFactory: () => TContext
  ) {
    if (!callbacks || !callbacks.length) {
      return;
    }

    const ctx = ctxFactory();
    const currentSequenceId = this.stateSequenceId;

    for (const callback of callbacks) {
      if (this.stateSequenceId !== currentSequenceId) {
        // If a transition was triggered during the handling of a previous
        // callback, we want to 'unroll' this loop to prevent subsequent
        // handlers from firing.
        break;
      }

      // TODO: Wrap in try / catch?
      callback(ctx);
    }
  }

  private sendEventInternal(event: EventWithoutData<TEvent>['id'] | TEvent) {
    if (this.runState !== RunState.Started) {
      return;
    }

    const eventObj = typeof event === 'string' ? ({ id: event } as TEvent) : event;

    // We should only initiate flushing if the queues are empty
    const shouldInitiateFlushing =
      this.externalEventQueue.length === 0 && this.internalEventQueue.length === 0;

    this.internalEventQueue.push(Object.freeze({ ...eventObj }));

    if (shouldInitiateFlushing) {
      this.flushEventQueue();
    }
  }

  private transitionTo(state: StateWithoutData<TState>['id'] | TState, event?: TEvent) {
    if (this.runState !== RunState.Started) {
      return;
    }

    const stateObj = typeof state === 'string' ? ({ id: state } as TState) : state;
    const currentState = this.internalState;
    const shouldTriggerTransition = stateObj.id !== currentState.id;

    if (shouldTriggerTransition) {
      // Cause all registered disposables for the current state to be disposed.
      this.currentStateDisposables.clear();

      this.handleOnExit(event);
    }

    this.internalState = Object.freeze({ ...stateObj });

    // This is an out-of-band signal that while the state may 'look'
    // totally the same, it is a new state nonetheless and any pending
    // side-effects should be short-circuited.
    this.stateSequenceId++;

    this.onStateChangeEmitter.fire(this.state);

    const toStateDef = this.def.states[stateObj.id as TState['id']];

    if (toStateDef && toStateDef.isFinalState) {
      this.runState = RunState.Finished;
    }

    if (shouldTriggerTransition) {
      this.handleOnEnter(event);
    }
  }
}

class OnEnterContextImpl<TState extends AnyState, TEvent extends AnyEvent>
  implements OnEnterContext<TState, TEvent> {
  private isDisposed = false;
  private readonly stateDisposer = new DisposableStore();

  constructor(
    readonly state: TState,
    readonly event: TEvent | undefined,
    private readonly _send: (event: EventWithoutData<TEvent>['id'] | TEvent) => void,
    private readonly _transitionTo: (state: StateWithoutData<TState>['id'] | TState) => void
  ) {}

  dispose() {
    this.isDisposed = true;
    this.stateDisposer.dispose();
  }

  registerDisposable(disposable: IDisposable) {
    if (this.isDisposed) {
      return;
    }

    this.stateDisposer.add(disposable);
  }

  runAfter(delay: number, handler: (ctx: OnEnterContext<TState, TEvent>) => void) {
    if (this.isDisposed) {
      return;
    }

    this.registerDisposable(disposableSetTimeout(() => handler(this), delay));
  }

  runEvery(interval: number, handler: (ctx: OnEnterContext<TState, TEvent>) => void) {
    if (this.isDisposed) {
      return;
    }

    this.registerDisposable(disposableSetInterval(() => handler(this), interval));
  }

  send(event: EventWithoutData<TEvent>['id'] | TEvent): void {
    if (this.isDisposed) {
      return;
    }

    this._send(event);
  }

  transitionTo(state: StateWithoutData<TState>['id'] | TState): void {
    if (this.isDisposed) {
      return;
    }

    this._transitionTo(state);
  }
}

class OnEventContextImpl<TState extends AnyState, TEvent extends AnyEvent>
  implements OnEventContext<TState, TEvent>, IDisposable {
  private isDisposed = false;
  private readonly stateDisposer = new DisposableStore();

  constructor(
    readonly state: TState,
    readonly event: TEvent,
    private readonly _send: (event: EventWithoutData<TEvent>['id'] | TEvent) => void,
    private readonly _transitionTo: (state: StateWithoutData<TState>['id'] | TState) => void
  ) {}

  dispose() {
    this.isDisposed = true;
    this.stateDisposer.dispose();
  }

  registerDisposable(disposable: IDisposable) {
    if (this.isDisposed) {
      return;
    }

    this.stateDisposer.add(disposable);
  }

  runAfter(delay: number, handler: (ctx: OnEventContext<TState, TEvent>) => void) {
    if (this.isDisposed) {
      return;
    }

    this.registerDisposable(disposableSetTimeout(() => handler(this), delay));
  }

  runEvery(interval: number, handler: (ctx: OnEventContext<TState, TEvent>) => void) {
    if (this.isDisposed) {
      return;
    }

    this.registerDisposable(disposableSetInterval(() => handler(this), interval));
  }

  send(event: EventWithoutData<TEvent>['id'] | TEvent): void {
    if (this.isDisposed) {
      return;
    }

    this._send(event);
  }

  transitionTo(state: StateWithoutData<TState>['id'] | TState): void {
    if (this.isDisposed) {
      return;
    }

    this._transitionTo(state);
  }
}

class OnExitContextImpl<TState extends AnyState, TEvent extends AnyEvent>
  implements OnExitContext<TState, TEvent>, IDisposable {
  constructor(readonly state: TState, readonly event?: TEvent) {}
  dispose() {}
}

function disposableSetInterval(
  handler: (...args: any[]) => any,
  timeout?: number,
  ...args: any[]
): IDisposable {
  const handle = setInterval(handler, timeout, ...args);

  return {
    dispose() {
      clearInterval(handle);
    },
  };
}

function disposableSetTimeout(
  handler: (...args: any[]) => any,
  timeout?: number,
  ...args: any[]
): IDisposable {
  const handle = setTimeout(handler, timeout, ...args);

  return {
    dispose() {
      clearTimeout(handle);
    },
  };
}
