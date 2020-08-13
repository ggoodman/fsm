import { DefineEvent, DefineState, Service } from './src';

type Red = DefineState<'red'>;
type Yellow = DefineState<'yellow'>;
type Green = DefineState<'green'>;

type Tick = DefineEvent<'tick'>;

const service = Service.define<Red | Yellow | Green, Tick>(
  (s) =>
    s
      .defineState('red', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(30 * 100, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('green'))
      )
      .defineState('green', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(60 * 100, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('yellow'))
      )
      .defineState('yellow', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(10 * 100, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('red'))
      ),
  'red'
);

service.onStateChange((state) => {
  console.log('State changed to %s', state.id);
});
service.start();
