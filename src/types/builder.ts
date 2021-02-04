import type { OnEnterContext, OnEventContext, OnExitContext } from './context';
import type { AnyEvent } from './events';
import type { AnyState } from './states';

export type OnEnterHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> = (ctx: OnEnterContext<TState, TEvent, TCurrentState>) => void;

export type OnEventHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState,
  TCurrentEvent extends TEvent = TEvent
> = (ctx: OnEventContext<TState, TEvent, TCurrentState, TCurrentEvent>) => void;

export type OnExitHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> = (ctx: OnExitContext<TState, TEvent, TCurrentState>) => void;

export interface AtomicStateBuilder<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> {
  isFinalState: boolean;

  onEnter(handler: OnEnterHandler<TState, TEvent, TCurrentState>): this;

  onEvent<TCurrentEventId extends TEvent['id']>(
    eventId: TCurrentEventId,
    handler: OnEventHandler<TState, TEvent, TCurrentState, Extract<TEvent, { id: TCurrentEventId }>>
  ): this;

  onExit(handler: OnExitHandler<TState, TEvent, TCurrentState>): this;
}

export interface CompoundStateBuilder<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState
> extends AtomicStateBuilder<TState, TEvent, TCurrentState> {
  defineFinalState<TDefinedStateId extends TState['id']>(
    id: TDefinedStateId,
    builderFn?: (
      builder: AtomicStateBuilder<TState, TEvent, Extract<TState, { id: TDefinedStateId }>>
    ) => void
  ): this;

  defineState<TDefinedStateId extends TState['id']>(
    id: TDefinedStateId,
    builderFn?: (
      builder: AtomicStateBuilder<TState, TEvent, Extract<TState, { id: TDefinedStateId }>>
    ) => void
  ): this;
}
