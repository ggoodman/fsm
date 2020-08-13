import { Service } from './service';
import { DefineEvent } from './types/events';
import { DefineState } from './types/states';

export function fromTask<T = unknown, TError = unknown>(task: () => Promise<T>) {
  type Initial = DefineState<'initial', () => Promise<T>>;
  type Pending = DefineState<'pending', Promise<T>>;
  type Resolved = DefineState<'resolved', T>;
  type Rejected = DefineState<'rejected', TError>;

  type Resolve = DefineEvent<'resolve', T>;
  type Reject = DefineEvent<'reject', TError>;

  return Service.define<Initial | Pending | Resolved | Rejected, Resolve | Reject>(
    (state) =>
      state
        .defineState('initial', (state) =>
          state.onEnter((ctx) => ctx.transitionTo({ id: 'pending', data: ctx.state.data() }))
        )
        .defineState('pending', (state) =>
          state
            .onEnter((ctx) =>
              ctx.state.data.then(
                (value) => ctx.send({ id: 'resolve', data: value }),
                (err) => ctx.send({ id: 'reject', data: err })
              )
            )
            .onEvent('resolve', (ctx) => ctx.transitionTo({ id: 'resolved', data: ctx.event.data }))
            .onEvent('reject', (ctx) => ctx.transitionTo({ id: 'rejected', data: ctx.event.data }))
        )
        .defineFinalState('resolved')
        .defineFinalState('rejected'),
    { id: 'initial', data: task }
  );
}
