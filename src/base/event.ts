import { onUnexpectedError } from './errors';
import { once as onceFn } from './functional';
import { Disposable, IDisposable, toDisposable, combinedDisposable, DisposableStore, isDisposable } from './lifecycle';
import { LinkedList } from './linkedList';
import { Iterator } from './iterator';


/**
 * To an event a function with one or zero parameters
 * can be subscribed. The event is the subscriber function itself.
 */
export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable;
}

export interface EmitterOptions {
  onFirstListenerAdd?: Function;
  onFirstListenerDidAdd?: Function;
  onListenerDidAdd?: Function;
  onLastListenerRemove?: Function;
  leakWarningThreshold?: number;
}

type Listener<T> = [(e: T) => void, any] | ((e: T) => void);

export interface IChainableEvent<T> {
  event: Event<T>;
  map<O>(fn: (i: T) => O): IChainableEvent<O>;

}




let _globalLeakWarningThreshold = -1;
// for debug use
export function setGlobalLeakWarningThreshold(n: number): IDisposable {
	const oldValue = _globalLeakWarningThreshold;
	_globalLeakWarningThreshold = n;
	return {
		dispose() {
			_globalLeakWarningThreshold = oldValue;
		}
	};
}

class LeakageMonitor {
  private _stacks: Map<string, number> | undefined;
  private _warnCountdown: number = 0;

  constructor(
    readonly customThreshold?: number, 
    readonly name: string = Math.random().toString(18).slice(2, 5),
  ) {}

  dispose() {
    if (this._stacks) {
      this._stacks.clear();
    }
  }

  check(listenerCount: number): undefined | (() => void) {
    let threshold = _globalLeakWarningThreshold;
    if (typeof this.customThreshold === 'number') {
      threshold = this.customThreshold;
    }
    if (threshold <= 0 || listenerCount < threshold) {
      return undefined;
    }
    if (!this._stacks) {
      this._stacks = new Map();
    }
    const stack = new Error().stack!.split('\n').slice(3).join('\n');
    const count = this._stacks.get(stack) || 0;
    this._stacks.set(stack, count + 1);
    this._warnCountdown -= 1;

    if (this._warnCountdown <= 0) {
      // only warn on first exceed and then every time the limit
			// is exceeded by 50% again
			this._warnCountdown = threshold * 0.5;

			// find most frequent listener and print warning
			let topStack: string;
			let topCount: number = 0;
			this._stacks.forEach((count, stack) => {
				if (!topStack || topCount < count) {
					topStack = stack;
					topCount = count;
				}
			});

			console.warn(`[${this.name}] potential listener LEAK detected, having ${listenerCount} listeners already. MOST frequent listener (${topCount}):`);
			console.warn(topStack!);
    }

    return () => {
      const count = (this._stacks!.get(stack) || 0);
			this._stacks!.set(stack, count - 1); 
    }
  }

}


export class Emitter<T> {
  private static readonly _noop = function() {};

  private readonly _options?: EmitterOptions;
  private readonly _leakageMon?: LeakageMonitor;
  private _disposed: boolean = false;
  private _event?: Event<T>;
  private _deliveryQueue?: LinkedList<[Listener<T>, T]>;
  protected _listeners?: LinkedList<Listener<T>>;

  constructor(options?: EmitterOptions) {
    this._options = options;
    this._leakageMon = _globalLeakWarningThreshold > 0
      ? new LeakageMonitor(this._options && this._options.leakWarningThreshold)
      : undefined;
  }

  get event(): Event<T> {
    if (this._event) {
      return this._event;
    }
    this._event = (listener: (e: T) => any, thisArgs?:any, disposables?: IDisposable[] | DisposableStore) => {
      if (!this._listeners) {
        this._listeners = new LinkedList();
      }
      const firstListener = this._listeners.isEmpty();
      if (firstListener && this._options && this._options.onFirstListenerAdd) {
        this._options.onFirstListenerAdd(this);
      }
      const remove = this._listeners.push(!thisArgs? listener: [listener, thisArgs]);
      if (firstListener && this._options && this._options.onFirstListenerDidAdd) {
        this._options.onFirstListenerDidAdd(this);
      }
      if (this._options && this._options.onListenerDidAdd) {
        this._options.onListenerDidAdd(this, listener, thisArgs);
      }

      // check and record this emitter for potential leakage
      let removeMonitor: (() => void) | undefined;
      if (this._leakageMon) {
        removeMonitor = this._leakageMon.check(this._listeners.size);
      }

      let result: IDisposable = {
        dispose: () => {
          if (removeMonitor) {
            removeMonitor();
          }
          result.dispose = Emitter._noop;
          if (!this._disposed) {
            remove();
            if (this._options && this._options.onLastListenerRemove) {
              const hasListeners = (this._listeners && !this._listeners.isEmpty());
              if (!hasListeners) {
                this._options.onLastListenerRemove(this);
              }
            }
          }
        }
      };
      if (disposables instanceof DisposableStore) {
        disposables.add(result);
      } else if (Array.isArray(disposables)) {
        disposables.push(result);
      }
      return result;
    }

    return this._event;
  }

  fire(event: T): void {
    if (!this._listeners) {
      return;
    }
    if (!this._deliveryQueue) {
      this._deliveryQueue = new LinkedList();
    }
    for (let iter = this._listeners.iterator(), e = iter.next(); !e.done; e = iter.next()) {
      this._deliveryQueue.push([e.value, event]);
    }
    while (this._deliveryQueue.size > 0) {
      const [listener, event] = this._deliveryQueue.shift()!;
      try {
        if (typeof listener === 'function') {
          listener.call(undefined, event);
        } else {
          listener[0].call(listener[1], event);
        }
      } catch (e) {
        onUnexpectedError(e);
      }
    }
  }

  dispose() {
    if (this._listeners) {
      this._listeners.clear();
    }
    if (this._deliveryQueue) {
      this._deliveryQueue.clear();
    }
    if (this._leakageMon) {
      this._leakageMon.dispose();
    }
    this._disposed = true;
  }


}












export namespace Event {
  export const None: Event<any> = () => Disposable.None;

  export function once<T>(event: Event<T>): Event<T> {
    return (listener, thisArgs = null, disposables?) => {
      let didFire = false;
      let result: IDisposable;
      result = event(e => {
        if (didFire) {
          return;
        } else if (result) {
          result.dispose();
        } else {
          didFire = true;
        }
        return listener.call(thisArgs, e);
      }, null, disposables);

      if (didFire) {
        result.dispose();
      }
      return result;
    }
  }

  export function snapshot<T>(event: Event<T>): Event<T> {
    let listener: IDisposable;
    const emitter = new Emitter<T>({
      onFirstListenerAdd() {
        listener = event(emitter.fire, emitter);
      },
      onLastListenerRemove() {
        listener.dispose();
      }
    })
    return emitter.event;
  }

  export function map<I, O>(event: Event<I>, map: (i: I) => O): Event<O> {
    return snapshot((listener, thisArgs = null, disposables?) => event(i => listener.call(thisArgs, map(i)), null, disposables));
  }

  export function forEach<I>(event: Event<I>, each: (i: I) => void): Event<I> {
    return snapshot((listener, thisArgs = null, disposables?) => event(i => {each(i); listener.call(thisArgs, i);}, null, disposables))
  }

  export function filter<T>(event: Event<T>, filter: (e: T) => boolean): Event<T>;
  export function filter<T, R>(event: Event<T | R>, filter: (e: T | R) => e is R): Event<R>;
  export function filter<T>(event: Event<T>, filter:(e: T) => boolean): Event<T> {
    return snapshot((listener, thisArgs = null, disposables?) => event(e => filter(e) && listener.call(thisArgs, e), null, disposables));
  }

  export function signal<T>(event: Event<T>): Event<void> {
    return event as Event<any> as Event<void>;
  }

  export function any<T>(...events: Event<T>[]): Event<T> {
    return (listener, thisArgs = null, disposables?) => combinedDisposable(...events.map(event => event(e => listener.call(thisArgs, e), null, disposables)));
  }

  export function reduce<I, O>(event: Event<I>, merge: (last: O | undefined, event:I) => O, initial?: O): Event<O> {
    let output: O | undefined = initial;
    return map<I, O>(event, e => {
      output = merge(output, e);
      return output;
    })
  }

  /**
	 * Debounces the provided event, given a `merge` function.
	 *
	 * @param event The input event.
	 * @param merge The reducing function.
	 * @param delay The debouncing delay in millis.
	 * @param leading Whether the event should fire in the leading phase of the timeout.
	 * @param leakWarningThreshold The leak warning threshold override.
	 */
  export function debounce<T>(event: Event<T>, merge: (last: T | undefined, event: T) => T, delay?: number, leading?: boolean, leakWarningThreshold?: number): Event<T>;
	export function debounce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, delay?: number, leading?: boolean, leakWarningThreshold?: number): Event<O>;
	export function debounce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, delay: number = 100, leading = false, leakWarningThreshold?: number): Event<O> {
    let subscription: IDisposable;
    let output: O | undefined = undefined;
    let handle: any = undefined;
    let numDebouncedCalls = 0;

    const emitter = new Emitter<O>({
      leakWarningThreshold,
      onFirstListenerAdd() {
        subscription = event(cur => {
          numDebouncedCalls++;
          output = merge(output, cur);
          if (leading && !handle) {
            emitter.fire(output);
          }
          clearTimeout(handle);
          handle = setTimeout(() => {
            const _output = output;
            output = undefined;
            handle = undefined;
            if (!leading || numDebouncedCalls > 1) {
              emitter.fire(_output!);
            }
            numDebouncedCalls = 0;
          }, delay);

        });
      },
      onLastListenerRemove() {
        subscription.dispose();
      }
    });

    return emitter.event;
  }

  export function stopwatch<T>(event: Event<T>): Event<number> {
    const start = new Date().getTime();
    return map(once(event), _ => new Date().getTime() - start);
  }

  export function latch<T>(event: Event<T>): Event<T> {
    let firstCall = true;
    let cache: T;
    return filter(event, value => {
      const shouldEmit = firstCall || value !== cache;
      firstCall = false;
      cache = value;
      return shouldEmit;
    })
  }

  export function buffer<T>(event: Event<T>, nextTick = false, _buffer: T[] = []): Event<T> {
    let buffer: T[] | null = _buffer.slice();
    let listener: IDisposable | null = event(e => {
      if (buffer) {
        buffer.push(e);
      } else {
        emitter.fire(e);
      }
    });

    const flush = () => {
      if (buffer) {
        buffer.forEach(e => emitter.fire(e));
      }
      buffer = null;
    }

    const emitter = new Emitter<T>({
      onFirstListenerAdd() {
        if (!listener) {
          listener = event(e => emitter.fire(e));
        }
      },
      onFirstListenerDidAdd() {
        if (buffer) {
          if (nextTick) {
            setTimeout(flush);
          } else {
            flush();
          }
        }
      },
      onLastListenerRemove() {
        if (listener) {
          listener.dispose();
        }
        listener = null;
      }
    });

    return emitter.event;

  }







}