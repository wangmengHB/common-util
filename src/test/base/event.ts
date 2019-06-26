
import {Event, Emitter} from 'src/base/event';

namespace Samples {

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
}

suite('Event', function() {

  const counter = new Samples.EventCounter();

  setup(() => counter.reset());

  test('Emitter plain'), function () {

    let doc = new Samples.Document3();

    let subscription = doc.onDidChange(counter.onEvent, counter);

    subscription.dispose();






  })



})

