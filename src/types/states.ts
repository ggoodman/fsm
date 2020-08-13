export type DefineState<TStateName extends string, TData = undefined> = {
  id: TStateName;
  data: TData;
};

export type AnyState = DefineState<string> | DefineState<string, unknown>;

export type StateWithoutData<TState extends AnyState> = TState extends AnyState
  ? [TState['data']] extends [undefined]
    ? TState
    : never
  : never;

// export type StrippedState<TState extends AnyState> = {
//   [TStateId in TState['id']]: [Extract<TState, {id: TStateId}>['data']] extends [never] ? { id: TStateId} : Extract<TState, {id: TStateId}>
// }[TState['id']]
