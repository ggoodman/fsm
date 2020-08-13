export type DefineState<TStateName extends string, TData = never> = {
  id: TStateName;
  data: TData;
};
export type AnyState = DefineState<string> | DefineState<string, unknown>;
export type StateWithData<TState extends AnyState> = TState extends AnyState
  ? [TState["data"]] extends [never]
    ? never
    : TState
  : never;
export type StateWithoutData<TState extends AnyState> = Exclude<
  TState,
  StateWithData<TState>
>;
