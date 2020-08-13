import { OnEnterHandler, OnEventHandler } from "./builder";
import { AnyEvent } from "./events";
import { AnyState } from "./states";

export interface AtomicStateDefinition<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> {
  readonly onEnterCallbacks: OnEnterHandler<TState, TEvent, TCurrentState>[];
  readonly onEventCallbacks: {
    [eventId: string]: OnEventHandler<TState, TEvent>[];
  };
  readonly onExitCallbacks: OnEnterHandler<TState, TEvent>[];
}

export interface CompoundStateDefinition<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> extends AtomicStateDefinition<TState, TEvent, TCurrentState> {
  readonly states: {
    [TStateName in TState["id"]]?: {
      onEnterCallbacks: OnEnterHandler<TState, TEvent>[];
      onEventCallbacks: {
        [eventId: string]: OnEventHandler<TState, TEvent>[];
      };
      onExitCallbacks: OnEnterHandler<TState, TEvent>[];
    };
  };
}
