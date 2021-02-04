import { Service } from './service';

describe('service', () => {
  it('will start in the initial state', () => {
    const service = Service.define((builder) => builder.defineState('initial'), {
      id: 'initial',
      data: undefined,
    });

    expect(service.state.id).toEqual('initial');
  });

  it('will automatically transition on start, via initial state onEnter', () => {
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state.onEnter((ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
          )
          .defineState('final'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('final');
  });

  it('will automatically transition on start, via top-level onEnter', () => {
    const service = Service.define(
      (builder) =>
        builder
          .onEnter((ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
          .defineState('initial')
          .defineState('final'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('final');
  });

  it('will short-circuit the child onEnter when the top-level onEnter triggers a transition', () => {
    const service = Service.define(
      (builder) =>
        builder
          .onEnter((ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
          .defineState('initial', (state) =>
            state.onEnter((ctx) => ctx.transitionTo({ id: 'never', data: undefined }))
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('final');
  });

  it('will not dispose registered disposables on transitions to the same state', () => {
    const dispose = jest.fn(() => undefined);
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state.onEnter((ctx) => {
              ctx.registerDisposable({ dispose });
              ctx.transitionTo({ id: 'initial', data: undefined });
            })
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('initial');
    expect(dispose).toBeCalledTimes(0);
  });

  it('will dispose registered disposables on transitions to another state', () => {
    const dispose = jest.fn(() => undefined);
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state.onEnter((ctx) => {
              ctx.registerDisposable({ dispose });
              ctx.transitionTo({ id: 'final', data: undefined });
            })
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('final');
    expect(dispose).toBeCalledTimes(1);
  });

  it('will handle internal events before external events', () => {
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state
              .onEvent('internal', (ctx) =>
                ctx.send({ id: 'internal-transition', data: undefined })
              )
              .onEvent('external', (ctx) => ctx.transitionTo({ id: 'never', data: undefined }))
              .onEvent('internal-transition', (ctx) =>
                ctx.transitionTo({ id: 'final', data: undefined })
              )
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    service.send({ id: 'internal', data: undefined });
    service.send({ id: 'external', data: undefined });
    expect(service.state.id).toEqual('final');
  });

  it('will not process further queued events when a transition occurs', () => {
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state
              .onEvent('final', (ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
              .onEvent('never', (ctx) => ctx.transitionTo({ id: 'never', data: undefined }))
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    service.send({ id: 'final', data: undefined });
    service.send({ id: 'never', data: undefined });
    expect(service.state.id).toEqual('final');
  });

  it('will not process events emitted on a stale context', async () => {
    let resolve: () => void | undefined;
    let timeoutFired = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });
    const service = Service.define(
      (builder) =>
        builder
          .onEvent('never', (ctx) => ctx.transitionTo({ id: 'never', data: undefined }))
          .onEvent('final', (ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
          .defineState('initial', (state) =>
            state.onEnter((ctx) => {
              setTimeout(() => {
                ctx.send('never');
                resolve();
              });
              ctx.send('final');
            })
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    await timeoutFired;
    expect(service.state.id).toEqual('final');
  });

  it('will not process transitions using a stale context', async () => {
    let resolve: () => void | undefined;
    let timeoutFired = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });
    const service = Service.define(
      (builder) =>
        builder
          .defineState('initial', (state) =>
            state.onEnter((ctx) => {
              setTimeout(() => {
                ctx.transitionTo('never');
                resolve();
              });
              ctx.transitionTo('final');
            })
          )
          .defineState('final')
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    await timeoutFired;
    expect(service.state.id).toEqual('final');
  });

  it('will not process further transitions when on a final state', () => {
    const service = Service.define(
      (builder) =>
        builder
          .onEnter((ctx) => ctx.transitionTo({ id: 'final', data: undefined }))
          .defineFinalState('final', (state) =>
            state.onEnter((ctx) => {
              ctx.transitionTo({ id: 'never', data: undefined });
            })
          )
          .defineState('never'),
      { id: 'initial', data: undefined }
    );

    expect(service.state.id).toEqual('initial');
    service.start();
    expect(service.state.id).toEqual('final');
  });
});
