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

  export function filter<T>(event: Event<T>, filter: (e: T) => boolean): 


}