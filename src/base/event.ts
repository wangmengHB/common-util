import { onUnexpectedError } from './errors';
import { once as onceFn } from './functional';
import { Disposable, IDisposable, toDisposable, combinedDisposable, DisposableStore } from './lifecycle';
import { LinkedList } from './linkedList';


/**
 * To an event a function with one or zero parameters
 * can be subscribed. The event is the subscriber function itself.
 */
export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable;
}

export namespace Event {
  export const None: Event<any> = () => Disposable.None;

  export function once<T>(event: Event<T>): Event<T> {
    
  }




}

type Listener<T> = [(e: T) => void, any] | ((e: T) => void);



