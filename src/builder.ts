import type {
  AtomicStateBuilder,
  CompoundStateBuilder,
  OnEnterHandler,
  OnEventHandler,
  OnExitHandler,
} from './types/builder';
import type { AtomicStateDefinition, CompoundStateDefinition } from './types/definition';
import type { AnyEvent } from './types/events';
import type { AnyState } from './types/states';

class AtomicStateBuilderImpl<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState
> implements
    AtomicStateBuilder<TState, TEvent, TCurrentState>,
    AtomicStateDefinition<TState, TEvent, TCurrentState> {
  public readonly onEnterCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >['onEnterCallbacks'] = [];
  public readonly onEventCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >['onEventCallbacks'] = {};
  public readonly onExitCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >['onExitCallbacks'] = [];

  constructor(public readonly isFinalState: boolean) {}

  onEnter(handler: OnEnterHandler<TState, TEvent, TCurrentState>) {
    this.onEnterCallbacks.push(handler);
    return this;
  }

  onEvent<TCurrentEvent extends TEvent>(
    eventId: TCurrentEvent['id'],
    handler: OnEventHandler<TState, TEvent, TCurrentState, TCurrentEvent>
  ) {
    let eventCbs = this.onEventCallbacks[eventId];

    if (!eventCbs) {
      eventCbs = [];
      this.onEventCallbacks[eventId] = eventCbs;
    }

    eventCbs.push(handler as OnEventHandler<TState, TEvent>);

    return this;
  }

  onExit(handler: OnExitHandler<TState, TEvent, TCurrentState>) {
    this.onExitCallbacks.push(handler);
    return this;
  }
}

class CompoundBuilderImpl<
    TState extends AnyState,
    TEvent extends AnyEvent,
    TCurrentState extends TState = TState
  >
  extends AtomicStateBuilderImpl<TState, TEvent, TCurrentState>
  implements
    CompoundStateBuilder<TState, TEvent, TCurrentState>,
    CompoundStateDefinition<TState, TEvent, TCurrentState> {
  public readonly states: CompoundStateDefinition<TState, TEvent, TCurrentState>['states'] = {};

  constructor() {
    super(false);
  }

  defineFinalState<TDefinedState extends TState>(
    id: TDefinedState['id'],
    builderFn?: (builder: AtomicStateBuilder<TState, TEvent, TDefinedState>) => void
  ) {
    const builder = new AtomicStateBuilderImpl<TState, TEvent>(true);

    if (builderFn) {
      builderFn((builder as unknown) as AtomicStateBuilder<TState, TEvent, TDefinedState>);
    }

    this.states[id] = builder;

    return this;
  }

  defineState<TDefinedState extends TState>(
    id: TDefinedState['id'],
    builderFn?: (builder: AtomicStateBuilder<TState, TEvent, TDefinedState>) => void
  ) {
    const builder = new AtomicStateBuilderImpl<TState, TEvent>(false);

    if (builderFn) {
      builderFn((builder as unknown) as AtomicStateBuilder<TState, TEvent, TDefinedState>);
    }

    this.states[id] = builder;

    return this;
  }
}

export function defineCompoundState<TState extends AnyState, TEvent extends AnyEvent>(
  builderFn?: (builder: CompoundStateBuilder<TState, TEvent>) => void
) {
  const builder = new CompoundBuilderImpl<TState, TEvent>();

  if (builderFn) {
    builderFn(builder);
  }

  return builder;
}
