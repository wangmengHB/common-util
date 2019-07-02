
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


  test('fromPromise', function() {
    let count = 0;
    const event = Event.fromPromise(Promise.resolve(null));
    event(() => count++);
    console.log(count);
    setTimeout(() => console.log(count), 0);

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



suite('PausableEmitter', function () {

	test('basic', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>();

		emitter.event(e => data.push(e));
		emitter.fire(1);
		emitter.fire(2);

		assert.deepEqual(data, [1, 2]);
	});

	test('pause/resume - no merge', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>();

		emitter.event(e => data.push(e));
		emitter.fire(1);
		emitter.fire(2);
		assert.deepEqual(data, [1, 2]);

		emitter.pause();
		emitter.fire(3);
		emitter.fire(4);
		assert.deepEqual(data, [1, 2]);

		emitter.resume();
		assert.deepEqual(data, [1, 2, 3, 4]);
		emitter.fire(5);
		assert.deepEqual(data, [1, 2, 3, 4, 5]);
	});

	test('pause/resume - merge', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>({ merge: (a) => a.reduce((p, c) => p + c, 0) });

		emitter.event(e => data.push(e));
		emitter.fire(1);
		emitter.fire(2);
		assert.deepEqual(data, [1, 2]);

		emitter.pause();
		emitter.fire(3);
		emitter.fire(4);
		assert.deepEqual(data, [1, 2]);

		emitter.resume();
		assert.deepEqual(data, [1, 2, 7]);

		emitter.fire(5);
		assert.deepEqual(data, [1, 2, 7, 5]);
	});

	test('double pause/resume', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>();

		emitter.event(e => data.push(e));
		emitter.fire(1);
		emitter.fire(2);
		assert.deepEqual(data, [1, 2]);

		emitter.pause();
		emitter.pause();
		emitter.fire(3);
		emitter.fire(4);
		assert.deepEqual(data, [1, 2]);

		emitter.resume();
		assert.deepEqual(data, [1, 2]);

		emitter.resume();
		assert.deepEqual(data, [1, 2, 3, 4]);

		emitter.resume();
		assert.deepEqual(data, [1, 2, 3, 4]);
	});

	test('resume, no pause', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>();

		emitter.event(e => data.push(e));
		emitter.fire(1);
		emitter.fire(2);
		assert.deepEqual(data, [1, 2]);

		emitter.resume();
		emitter.fire(3);
		assert.deepEqual(data, [1, 2, 3]);
	});

	test('nested pause', function () {
		const data: number[] = [];
		const emitter = new PauseableEmitter<number>();

		let once = true;
		emitter.event(e => {
			data.push(e);

			if (once) {
				emitter.pause();
				once = false;
			}
		});
		emitter.event(e => {
			data.push(e);
		});

		emitter.pause();
		emitter.fire(1);
		emitter.fire(2);
		assert.deepEqual(data, []);

		emitter.resume();
		assert.deepEqual(data, [1, 1]); // paused after first event

		emitter.resume();
		assert.deepEqual(data, [1, 1, 2, 2]); // remaing event delivered

		emitter.fire(3);
		assert.deepEqual(data, [1, 1, 2, 2, 3, 3]);

	});
});


suite('EventMultiplexer', () => {

  test('works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();
    m.event(r => result.push(r));

    const e1 = new Emitter<number>();
    m.add(e1.event);

    assert.deepEqual(result, []);

    e1.fire(0);
    assert.deepEqual(result, [0]);
  });

  test('multiplexer dispose works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();
    m.event(r => result.push(r));

    const e1 = new Emitter<number>();
    m.add(e1.event);

    assert.deepEqual(result, []);

    e1.fire(0);
    assert.deepEqual(result, [0]);

    m.dispose();
    assert.deepEqual(result, [0]);

    e1.fire(0);
    assert.deepEqual(result, [0]);
  });

  test('event dispose works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();
    m.event(r => result.push(r));

    const e1 = new Emitter<number>();
    m.add(e1.event);

    assert.deepEqual(result, []);

    e1.fire(0);
    assert.deepEqual(result, [0]);

    e1.dispose();
    assert.deepEqual(result, [0]);

    e1.fire(0);
    assert.deepEqual(result, [0]);
  });

  test('mutliplexer event dispose works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();
    m.event(r => result.push(r));

    const e1 = new Emitter<number>();
    const l1 = m.add(e1.event);

    assert.deepEqual(result, []);

    e1.fire(0);
    assert.deepEqual(result, [0]);

    l1.dispose();
    assert.deepEqual(result, [0]);

    e1.fire(0);
    assert.deepEqual(result, [0]);
  });

  test('hot start works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();
    m.event(r => result.push(r));

    const e1 = new Emitter<number>();
    m.add(e1.event);
    const e2 = new Emitter<number>();
    m.add(e2.event);
    const e3 = new Emitter<number>();
    m.add(e3.event);

    e1.fire(1);
    e2.fire(2);
    e3.fire(3);
    assert.deepEqual(result, [1, 2, 3]);
  });

  test('cold start works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();

    const e1 = new Emitter<number>();
    m.add(e1.event);
    const e2 = new Emitter<number>();
    m.add(e2.event);
    const e3 = new Emitter<number>();
    m.add(e3.event);

    m.event(r => result.push(r));

    e1.fire(1);
    e2.fire(2);
    e3.fire(3);
    assert.deepEqual(result, [1, 2, 3]);
  });

  test('late add works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();

    const e1 = new Emitter<number>();
    m.add(e1.event);
    const e2 = new Emitter<number>();
    m.add(e2.event);

    m.event(r => result.push(r));

    e1.fire(1);
    e2.fire(2);

    const e3 = new Emitter<number>();
    m.add(e3.event);
    e3.fire(3);

    assert.deepEqual(result, [1, 2, 3]);
  });

  test('add dispose works', () => {
    const result: number[] = [];
    const m = new EventMultiplexer<number>();

    const e1 = new Emitter<number>();
    m.add(e1.event);
    const e2 = new Emitter<number>();
    m.add(e2.event);

    m.event(r => result.push(r));

    e1.fire(1);
    e2.fire(2);

    const e3 = new Emitter<number>();
    const l3 = m.add(e3.event);
    e3.fire(3);
    assert.deepEqual(result, [1, 2, 3]);

    l3.dispose();
    e3.fire(4);
    assert.deepEqual(result, [1, 2, 3]);

    e2.fire(4);
    e1.fire(5);
    assert.deepEqual(result, [1, 2, 3, 4, 5]);
  });
});


suite('AsyncEmitter', function () {

	test('event has waitUntil-function', async function () {

		interface E extends IWaitUntil {
			foo: boolean;
			bar: number;
		}

		let emitter = new AsyncEmitter<E>();

		emitter.event(e => {
			assert.equal(e.foo, true);
			assert.equal(e.bar, 1);
			assert.equal(typeof e.waitUntil, 'function');
		});

		emitter.fireAsync(thenables => ({
			foo: true,
			bar: 1,
			waitUntil(t: Promise<void>) { thenables.push(t); }
		}));
		emitter.dispose();
	});

	test('sequential delivery', async function () {

		interface E extends IWaitUntil {
			foo: boolean;
		}

		let globalState = 0;
		let emitter = new AsyncEmitter<E>();

		emitter.event(e => {
			e.waitUntil(timeout(10).then(_ => {
				assert.equal(globalState, 0);
				globalState += 1;
			}));
		});

		emitter.event(e => {
			e.waitUntil(timeout(1).then(_ => {
				assert.equal(globalState, 1);
				globalState += 1;
			}));
		});

		await emitter.fireAsync(thenables => ({
			foo: true,
			waitUntil(t) {
				thenables.push(t);
			}
		}));
		assert.equal(globalState, 2);
	});

	test('sequential, in-order delivery', async function () {
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
					assert.deepEqual(events, [1, 2]);
					done = true;
				}
			}));
		});

		// e2
		emitter.event(e => {
			events.push(e.foo);
			e.waitUntil(timeout(7));
		});

		await emitter.fireAsync(thenables => ({
			foo: 1,
			waitUntil(t) {
				thenables.push(t);
			}
		}));
		assert.ok(done);
	});
});