import { IDisposable } from "ts-primitives";
import { AnyEvent, EventWithData, EventWithoutData } from "./events";
import { AnyState, StateWithData, StateWithoutData } from "./states";

export interface Chart<TState extends AnyState, TEvent extends AnyEvent> {
  States: TState;
  StatesWithData: StateWithData<TState>;
  StatesWithoutData: StateWithoutData<TState>;
  StateIds: TState["id"];
  StateIdsWithData: StateWithData<TState>["id"];
  StateIdsWithoutData: StateWithoutData<TState>["id"];

  Events: TEvent;
  EventsWithData: EventWithData<TEvent>;
  EventsWithoutData: EventWithoutData<TEvent>;
  EventIds: TEvent["id"];
  EventIdsWithData: EventWithData<TEvent>["id"];
  EventIdsWithoutData: EventWithoutData<TEvent>["id"];
}

interface OnEnterContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> {
  event?: TEvent;
  state: TCurrentState;

  registerDisposable(disposable: IDisposable): void;

  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithoutData"]>(
    eventId: TTargetEvent["id"]
  ): void;
  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithData"]>(
    eventId: TTargetEvent["id"],
    data: TTargetEvent["data"]
  ): void;

  transitionTo<TTargetStateId extends Chart<TState, TEvent>["StateIdsWithoutData"]>(
    stateId: TTargetStateId
  ): void;
  transitionTo<TTargetStateId extends Chart<TState, TEvent>["StateIdsWithData"]>(
    stateId: TTargetStateId,
    data: TEvent extends { id: TTargetStateId, data: any } ? TEvent : never
  ): void;
}
export type OnEnterHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> = (ctx: OnEnterContext<TState, TEvent, TCurrentState>) => void;

export type OnEnterTransitionArgs<
  TState extends AnyState
> = TState extends StateWithoutData<TState>
  ? [targetStateId: TState["id"]]
  : [targetStateId: TState["id"], targetStateData: TState["data"]];

interface OnEventContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState,
  TCurrentEvent extends TEvent = TEvent
> {
  event: TCurrentEvent;
  state: TCurrentState;

  registerDisposable(disposable: IDisposable): void;

  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithoutData"]>(
    eventId: TTargetEvent["id"]
  ): void;
  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithData"]>(
    eventId: TTargetEvent["id"],
    data: TTargetEvent["data"]
  ): void;

  transitionTo<TTargetState extends StateWithoutData<TState>>(
    stateId: TTargetState['id']
  ): void;
  transitionTo<TTargetState extends StateWithData<TState>>(
    stateId: TTargetState['id'],
    data: TTargetState['data']
  ): void;
}
export type OnEventHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState,
  TCurrentEvent extends TEvent = TEvent
> = (ctx: OnEventContext<TState, TEvent, TCurrentState, TCurrentEvent>) => void;


interface OnEventDataContext<
TState extends AnyState,
TCurrentEvent extends AnyEvent
> {
  event: TCurrentEvent;
  state: TState;
}
export type OnEventTransitionArgs<
  TState extends AnyState,
  TCurrentState extends TState,
  TCurrentEvent extends AnyEvent,
> = TState extends StateWithData<TState>
  ? [eventId: TCurrentEvent['id'], targetStateId: TState["id"], targetStateDataHandler: (ctx: OnEventDataContext<TCurrentState, TCurrentEvent>) => TState['data']] : [eventId: TCurrentEvent['id'], targetStateId: TState["id"]]

interface OnExitContext<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> {
  event?: TEvent;
  state: TCurrentState;

  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithoutData"]>(
    eventId: TTargetEvent["id"]
  ): void;
  sendEvent<TTargetEvent extends Chart<TState, TEvent>["EventsWithData"]>(
    eventId: TTargetEvent["id"],
    data: TTargetEvent["data"]
  ): void;
}
export type OnExitHandler<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends AnyState = TState
> = (ctx: OnExitContext<TState, TEvent, TCurrentState>) => void;

export interface AtomicStateBuilder<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState
> {
  onEnter
  
  onEnterExecute(handler: OnEnterHandler<TState, TEvent, TCurrentState>): this;
  onEnterExecuteAfter(delay: number, handler: OnEnterHandler<TState, TEvent, TCurrentState>): this;

  onEnterTransition(...args: OnEnterTransitionArgs<TState>): this;
  onEnterTransitionAfter(delay: number, ...args: OnEnterTransitionArgs<TState>): this;

  onEventTransition<TCurrentEvent extends TEvent>(...args: OnEventTransitionArgs<TState, TCurrentState, TCurrentEvent>): this;
  onEventTransitionAfter<TCurrentEvent extends TEvent>(delay: number, ...args: OnEventTransitionArgs<TState, TCurrentState, TCurrentEvent>): this;

  onEventExecute<TCurrentEvent extends TEvent>(
    eventId: TCurrentEvent['id'],
    handler: OnEventHandler<TState, TEvent, TCurrentState, TCurrentEvent>
  ): this;

  onEventExecuteAfter<TCurrentEvent extends TEvent>(
    eventId: TCurrentEvent['id'],
    delay: number,
    handler: OnEventHandler<TState, TEvent, TCurrentState, TCurrentEvent>
  ): this;
}

export interface CompoundStateBuilder<
  TState extends AnyState,
  TEvent extends AnyEvent,
  TCurrentState extends TState = TState,
> extends AtomicStateBuilder<TState, TEvent, TCurrentState> {
  defineState<TDefinedState extends TState>(
    id: TDefinedState["id"],
    builderFn: (
      builder: AtomicStateBuilder<TState, TEvent, TDefinedState>
    ) => void
  ): this;
}
