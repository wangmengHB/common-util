
import {Event, Emitter, AsyncEmitter, PauseableEmitter, EventMultiplexer, EventBufferer, Relay, IWaitUntil} from './base/event';
import { IDisposable } from './base/lifecycle';




class EventCounter {
  count = 0;

  reset() {
    this.count = 0;
  }

  onEvent() {
    this.count += 1;
  }
}

class Document3 {
  private _onDidChange = new Emitter<string>();

  onDidChange: Event<string> = this._onDidChange.event;

  setText(value: string) {
    this._onDidChange.fire(value);
  }
}


const doc = new Document3();
const counter = new EventCounter();
let bucket: IDisposable[] = [];

// let subscription =  doc.onDidChange(counter.onEvent, counter, bucket);

interface E extends IWaitUntil {
  foo: number;
}
let events: number[] = [];
let done = false;
let emitter = new AsyncEmitter<E>();

// e1
emitter.event(e => {
  e.waitUntil(timeout(10).then(async _ => {
    if (e.foo === 1) {
      await emitter.fireAsync(thenables => ({
        foo: 2,
        waitUntil(t) {
          thenables.push(t);
        }
      }));
      console.log(JSON.stringify(events));
      done = true;
    }
  }));
});

// e2
emitter.event(e => {
  events.push(e.foo);
  e.waitUntil(timeout(7));
});


debugger;

emitter.fireAsync(thenables => ({
  foo: 1,
  waitUntil(t) {
    thenables.push(t);
  }
}));
console.log(done);


function timeout(s: number) {
  return new Promise((c, r) => {
    setTimeout(c, s);
  });
}


















