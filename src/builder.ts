import { IDisposable } from "ts-primitives";
import type {
  AtomicStateBuilder,
  CompoundStateBuilder,
  OnEnterHandler,
  OnEnterTransitionArgs,
  OnEventHandler,
  OnEventTransitionArgs,
} from "./types/builder";
import {
  AtomicStateDefinition,
  CompoundStateDefinition,
} from "./types/definition";
import { AnyEvent } from "./types/events";
import { AnyState } from "./types/states";

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

class AtomicStateBuilderImpl<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState
>
  implements
    AtomicStateBuilder<TState, TEvent, TCurrentState>,
    AtomicStateDefinition<TState, TEvent, TCurrentState> {
  public readonly onEnterCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >["onEnterCallbacks"] = [];
  public readonly onEventCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >["onEventCallbacks"] = {};
  public readonly onExitCallbacks: AtomicStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >["onExitCallbacks"] = [];

  onEnterExecute(handler: OnEnterHandler<TState, TEvent, TCurrentState>) {
    this.onEnterCallbacks.push(handler);
    return this;
  }

  onEnterExecuteAfter(
    delay: number,
    handler: OnEnterHandler<TState, TEvent, TCurrentState>
  ) {
    return this.onEnterExecute((ctx) =>
      ctx.registerDisposable(disposableSetTimeout(() => handler(ctx), delay))
    );
  }

  onEnterTransition(...args: OnEnterTransitionArgs<TState>) {
    return this.onEnterExecute(({ transitionTo }) =>
      transitionTo(args[0], args[1] as any)
    );
  }

  onEnterTransitionAfter(
    delay: number,
    ...args: OnEnterTransitionArgs<TState>
  ) {
    return this.onEnterExecute(({ registerDisposable, transitionTo }) =>
      registerDisposable(
        disposableSetTimeout(() => transitionTo(args[0], args[1] as any), delay)
      )
    );
  }

  onEventExecute<TCurrentEvent extends TEvent>(
    eventId: TCurrentEvent["id"],
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

  onEventExecuteAfter<TCurrentEvent extends TEvent>(
    eventId: TCurrentEvent["id"],
    delay: number,
    handler: OnEventHandler<TState, TEvent, TCurrentState, TCurrentEvent>
  ) {
    return this.onEventExecute(eventId, (ctx) =>
      ctx.registerDisposable(disposableSetTimeout(() => handler(ctx), delay))
    );
  }

  onEventTransition<TCurrentEvent extends TEvent>(
    ...args: OnEventTransitionArgs<TState, TCurrentState, TCurrentEvent>
  ) {
    return this.onEventExecute(args[0], ({ transitionTo }) =>
      transitionTo(args[1], args[2])
    );
  }

  onEventTransitionAfter<TCurrentEvent extends TEvent>(
    delay: number,
    ...args: OnEventTransitionArgs<TState, TCurrentState, TCurrentEvent>
  ) {
    return this.onEventExecute(
      args[0],
      ({ registerDisposable, transitionTo }) =>
        registerDisposable(
          disposableSetTimeout(() => transitionTo(args[1], args[2]), delay)
        )
    );
  }
}

class CompoundBuilderImpl<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState
> extends AtomicStateBuilderImpl<TState, TEvent, TCurrentState>
  implements
    CompoundStateBuilder<TState, TEvent, TCurrentState>,
    CompoundStateDefinition<TState, TEvent, TCurrentState> {
  public readonly states: CompoundStateDefinition<
    TState,
    TEvent,
    TCurrentState
  >["states"] = {};

  defineState<TDefinedState extends TState>(
    id: TDefinedState["id"],
    builderFn: (
      builder: AtomicStateBuilder<TState, TEvent, TDefinedState>
    ) => void
  ) {
    const builder = new AtomicStateBuilderImpl<TState, TEvent>();

    builderFn(
      (builder as unknown) as AtomicStateBuilder<TState, TEvent, TDefinedState>
    );

    this.states[id] = builder;

    return this;
  }
}

export function defineCompoundState<
  TState extends AnyState,
  TEvent extends AnyEvent
>(builderFn: (builder: CompoundStateBuilder<TState, TEvent>) => void) {
  const builder = new CompoundBuilderImpl<TState, TEvent>();

  builderFn(builder);
}
