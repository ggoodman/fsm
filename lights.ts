import { DefineEvent, DefineState, Service } from './src';
import { DefineCompoundState } from './src/types/states';

type PedWalk = DefineState<'walk'>;
type PedWarn = DefineState<'warn'>;

type Red = DefineCompoundState<'red', PedWalk | PedWarn>;
type Yellow = DefineState<'yellow'>;
type Green = DefineState<'green'>;

type Tick = DefineEvent<'tick'>;

const service = Service.define<Red | Yellow | Green, Tick>(
  (s) =>
    s
      .defineCompoundState('red', (red) =>
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
