export type DefineEvent<TEventName extends string, TData = never> = {
  id: TEventName;
  data: TData;
};
export type AnyEvent = DefineEvent<string> | DefineEvent<string, unknown>;
export type EventWithData<TEvent extends AnyEvent> = TEvent extends AnyEvent
  ? [TEvent['data']] extends [never]
    ? never
    : TEvent
  : never;
export type EventWithoutData<TEvent extends AnyEvent> = Exclude<TEvent, EventWithData<TEvent>>;
