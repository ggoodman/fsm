export type DefineEvent<TEventName extends string, TData = undefined> = {
  id: TEventName;
  data: TData;
};

export type AnyEvent = DefineEvent<string> | DefineEvent<string, unknown>;

export type EventWithoutData<TEvent extends AnyEvent> = TEvent extends AnyEvent
  ? [TEvent['data']] extends [undefined]
    ? TEvent
    : never
  : never;
