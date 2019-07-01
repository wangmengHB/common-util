
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

debugger;
let onDocDidChange = Event.debounce(doc.onDidChange, (prev: string[], cur) => {
  if (!prev) {
    prev = [cur];
  } else if (prev.indexOf(cur) < 0) {
    prev.push(cur);
  }
  return prev;
}, 10);

let count = 0;

debugger;
onDocDidChange(keys => {
  count++;
  console.log('count: ', count);
  console.log('keys', keys);
  if (count === 1) {
    doc.setText('4');
    console.log('count 1 keys', keys);
  } else if (count === 2) {
    console.log('count 2 keys', keys);
  }
});

doc.setText('1');
doc.setText('2');
doc.setText('3');





