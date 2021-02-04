import { OnEnterContext, OnEventContext, OnExitContext } from './context';
import { AnyEvent } from './events';
import { AnyState, ExtractCompoundState, StateKind } from './states';

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
  TCurrentState extends TState = TState,
  TTargetState extends AnyState = TState
> extends AtomicStateBuilder<TState, TEvent, TCurrentState> {
  defineCompoundState<TDefinedStateId extends ExtractCompoundState<TCurrentState>['id']>(
    id: TDefinedStateId,
    builderFn?: (
      builder: CompoundStateBuilder<
        ExtractCompoundState<TCurrentState>['childStates'],
        TEvent,
        Extract<ExtractCompoundState<TCurrentState>['childStates'], { id: TDefinedStateId }>,
        TTargetState
      >
    ) => void
  ): this;

  defineFinalState<TDefinedStateId extends TState['id']>(
    id: TDefinedStateId,
    builderFn?: (
      builder: AtomicStateBuilder<TTargetState, TEvent, Extract<TState, { id: TDefinedStateId }>>
    ) => void
  ): this;

  defineState<TDefinedStateId extends Extract<TState, { type: StateKind.Atomic }>['id']>(
    id: TDefinedStateId,
    builderFn?: (
      builder: AtomicStateBuilder<TTargetState, TEvent, Extract<TState, { id: TDefinedStateId }>>
    ) => void
  ): this;
}
