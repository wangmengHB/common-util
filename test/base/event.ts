
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

  test('Emitter plain', function () {

    let doc = new Samples.Document3();

    let subscription = doc.onDidChange(counter.onEvent, counter);

    subscription.dispose();

  });


  test('debounce', function () {
    let doc = new Samples.Document3();
    let onDocDidChange = Event.debounce(doc.onDidChange, (prev: string[], cur) => {
      if (!prev) {
        prev = [cur];
      } else if (prev.indexOf(cur) < 0) {
        prev.push(cur);
      }
      return prev;
    }, 10);
    
    let count = 0;
    
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


  });

  test('debounce 2', function() {
    let emitter = new Emitter<void>();
    let debounced = Event.debounce(emitter.event, (l, e) => e, 0, /*leading=*/true);

    let calls = 0;
    debounced(() => {
      calls++;
    });

    // If the source event is fired once, the debounced (on the leading edge) event should be fired only once
    emitter.fire();


  });

  test('buffer', function() {
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

  });

  




});

suite('stopwatch', function() {

  test('stopwatch', function() {

    const emitter = new Emitter<void>();
    let event = Event.stopwatch(emitter.event);

    event(duration => console.log(duration));

    setTimeout(() => emitter.fire(), 1000);
    emitter.fire();
    emitter.fire();
    emitter.fire();
    emitter.fire();



  });




});

suit('latch', function() {

  test('latch', function() {
    const emitter = new Emitter<number>();
    const event = Event.latch(emitter.event);

    const result: number[] = [];
    const listener = event(num => result.push(num));



    emitter.fire(1);
    console.log(JSON.stringify(result));

    emitter.fire(2);
    console.log(JSON.stringify(result));

    emitter.fire(2);
    console.log(JSON.stringify(result));

    emitter.fire(1);
    console.log(JSON.stringify(result));

    emitter.fire(1);
    console.log(JSON.stringify(result));

    emitter.fire(3);
    console.log(JSON.stringify(result));

    emitter.fire(3);
    console.log(JSON.stringify(result));

    emitter.fire(3);
    console.log(JSON.stringify(result));

    listener.dispose();
    console.log(JSON.stringify(result));





  });


  
});

