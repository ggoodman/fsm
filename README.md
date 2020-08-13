# @ggoodman/fsm

> Fully typed finite state machine for JavaScript and TypeScript

## Installation

```bash
npm install @ggoodman/fsm
```

## Example

The example below demonstrates a traffic light that cycles eternally on a timer.

> **Note**: Instead of defining the 'tick' event, we could have called `ctx.transitionTo('red' | 'green' | 'yellow')` directly.

```typescript
import { DefineEvent, DefineState, Service } from '@ggoodman/fsm';

type Red = DefineState<'red'>;
type Yellow = DefineState<'yellow'>;
type Green = DefineState<'green'>;

type Tick = DefineEvent<'tick'>;

const service = Service.define<Red | Yellow | Green, Tick>(
  (s) =>
    s
      .defineState('red', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(30 * 1000, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('green'))
      )
      .defineState('green', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(60 * 1000, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('yellow'))
      )
      .defineState('yellow', (red) =>
        red
          .onEnter((ctx) => ctx.runAfter(10 * 1000, (ctx) => ctx.send('tick')))
          .onEvent('tick', (ctx) => ctx.transitionTo('red'))
      ),
  'red'
);

service.onStateChange((state) => {
  console.log('State changed to %s', state.id);
});
service.start();
// State changed to red
// State changed to green
// State changed to yellow
// ...
```
