import type { OnEnterHandler, OnEventHandler, OnExitHandler } from './builder';
import type { AnyEvent } from './events';
import type { AnyState } from './states';

export interface AtomicStateDefinition<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> {
  readonly isFinalState: boolean;

  readonly onEnterCallbacks: OnEnterHandler<TState, TEvent, TCurrentState>[];
  readonly onEventCallbacks: {
    [eventId: string]: OnEventHandler<TState, TEvent, TCurrentState>[] | undefined;
  };
  readonly onExitCallbacks: OnExitHandler<TState, TEvent, TCurrentState>[];
}

export interface CompoundStateDefinition<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> extends AtomicStateDefinition<TState, TEvent, TCurrentState> {
  readonly states: {
    [TStateName in TState['id']]?: AtomicStateDefinition<TState, TEvent>;
  };
}
