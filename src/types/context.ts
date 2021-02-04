import type { IDisposable } from 'ts-primitives';
import type { AnyEvent, EventWithoutData } from './events';
import type { AnyState, StateWithoutData } from './states';

export interface OnEnterContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> extends IDisposable {
  event?: Readonly<TEvent>;
  state: Readonly<TCurrentState>;

  registerDisposable(disposable: IDisposable): void;

  runAfter(
    delay: number,
    handler: (ctx: OnEnterContext<TState, TEvent, TCurrentState>) => void
  ): void;

  runEvery(
    interval: number,
    handler: (ctx: OnEnterContext<TState, TEvent, TCurrentState>) => void
  ): void;

  send(event: EventWithoutData<TEvent>['id'] | TEvent): void;

  transitionTo(state: StateWithoutData<TState>['id'] | TState): void;
}

export interface OnEventContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState,
  TCurrentEvent extends TEvent = TEvent
> extends IDisposable {
  event: Readonly<TCurrentEvent>;
  state: Readonly<TCurrentState>;

  registerDisposable(disposable: IDisposable): void;

  runAfter(
    dely: number,
    handler: (ctx: OnEventContext<TState, TEvent, TCurrentState, TCurrentEvent>) => void
  ): void;

  runEvery(
    interval: number,
    handler: (ctx: OnEventContext<TState, TEvent, TCurrentState, TCurrentEvent>) => void
  ): void;

  send(event: EventWithoutData<TEvent>['id'] | TEvent): void;

  transitionTo(state: StateWithoutData<TState>['id'] | TState): void;
}

export interface OnExitContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> extends IDisposable {
  event?: Readonly<TEvent>;
  state: Readonly<TCurrentState>;
}
