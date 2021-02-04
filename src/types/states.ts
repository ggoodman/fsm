export const enum StateKind {
  Atomic = 'atomic',
  Compound = 'compound',
}

export type DefineState<TStateName extends string, TData = undefined> = {
  type: StateKind.Atomic;
  id: TStateName;
  data: TData;
};

export type DefineCompoundState<
  TStateName extends string,
  TChildStates extends AnyState,
  TData = undefined
> = {
  type: StateKind.Compound;
  id: TStateName;
  data: TData;
  childStates: TChildStates;
};

export type AnyState =
  | {
      type: StateKind.Atomic;
      id: string;
      data: unknown;
    }
  | {
      type: StateKind.Compound;
      id: string;
      data: unknown;
      childStates: AnyState;
    };

export type StateWithoutData<TState extends AnyState> = [TState['data']] extends [undefined]
  ? TState
  : never;

export type ExtractCompoundState<TState extends AnyState> = Extract<
  TState,
  { type: StateKind.Compound }
>;
