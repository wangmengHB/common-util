
import {Event, Emitter} from './base/event';
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


const emitter = new Emitter<number>();
const event = emitter.event;
const bufferedEvent = Event.buffer(event);

emitter.fire(1);
emitter.fire(2);
emitter.fire(3);
// nothing...

const listener = bufferedEvent(num => console.log(num));
// 1, 2, 3

emitter.fire(4);
// 4
















