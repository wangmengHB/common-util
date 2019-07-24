import { CancellationToken, CancellationTokenSource } from './cancellation';
import * as errors from './errors';
import { Emitter, Event } from './event';
import { IDisposable, toDisposable } from './lifecycle';
import { URI } from './uri';

interface Thenable<T> {
	/**
	* Attaches callbacks for the resolution and/or rejection of the Promise.
	* @param onfulfilled The callback to execute when the Promise is resolved.
	* @param onrejected The callback to execute when the Promise is rejected.
	* @returns A Promise for the completion of which ever callback is executed.
	*/
	then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
	then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
}

export interface CancelablePromise<T> {
  cancel(): void;
}

export interface ITask<T> {
  (): T;
}


export function isThenable<T>(obj: any): obj is Promise<T> {
  return obj && typeof (<Promise<any>> obj).then === 'function';
}

export function createCancelablePromise<T>(callback: (token: CancellationToken) => Promise<T>): CancelablePromise<T> {
  const source = new CancellationTokenSource();
  const thenable = callback(source.token);
  const promise = new Promise<T>((resolve, reject) => {
    source.token.onCancellationRequested(() =>  {
      reject(errors.canceled());
    })
    Promise.resolve(thenable).then(value => {
      source.dispose();
      resolve(value);
    }, err => {
      source.dispose();
      reject(err);
    });
  });
  return new class implements CancelablePromise<T> {
    cancel() {
      source.cancel();
    }
    then<TResult1 = T, TResult2 = never>(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
      return promise.then(resolve, reject);
    }
    catch<TResult = never>(reject?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
      return this.then(undefined, reject);
    }
    finally(onfinally?:(() => void) | undefined | null): Promise<T> {
      return promise.finally(onfinally);
    }
  }
}

export function raceCancellation<T>(promise: Promise<T>, token: CancellationToken): Promise<T | undefined>;
export function raceCancellation<T>(promise: Promise<T>, token: CancellationToken, defaultValue: T): Promise<T>;
export function raceCancellation<T>(promise: Promise<T>, token: CancellationToken, defaultValue?: T): Promise<T> {
  return Promise.race([promise, new Promise<T>(resolve => token.onCancellationRequested(() => resolve(defaultValue)))]);
}

export function asPromise<T>(callback: () => T | Thenable<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const item = callback();
    if (isThenable<T>(item)) {
      item.then(resolve, reject);
    } else {
      resolve(item);
    }
  });
}

export class Throttler {
  private activePromise: Promise<any> | null;
  private queuedPromise: Promise<any> | null;
  private queuedPromiseFactory: ITask<Promise<any>> | null;

  constructor() {
    this.activePromise = null;
    this.queuedPromise = null;
    this.queuedPromiseFactory = null;
  }

  queue<T>(promiseFactory: ITask<Promise<T>>): Promise<T> {
    if (this.activePromise) {
      this.queuedPromiseFactory = promiseFactory;
      if (!this.queuedPromise) {
        const onComplete = () => {
          this.queuedPromise = null;
          const result = this.queue(this.queuedPromiseFactory!);
          this.queuedPromiseFactory = null;
          return result;
        };
        this.queuedPromise = new Promise(c => {
          this.activePromise!.then(onComplete, onComplete).then(c);
        })
      }
    }

    this.activePromise = promiseFactory();

    return new Promise((c, e) => {
      this.activePromise!.then((result: any) => {
        this.activePromise = null;
        c(result);
      }, (err: any) => {
        this.activePromise = null;
        e(err);
      });
    });

  }

}

export class Sequencer {
  private current: Promise<any> = Promise.resolve(null);
  queue<T>(promiseTask: ITask<Promise<T>>): Promise<T> {
    return this.current = this.current.then(() => promiseTask());
  }
}

export class Delayer<T> implements IDisposable {
  private timeout: any;
  private completionPromise: Promise<any> | null;
  private doResolve: ((value?: any | Promise<any>) => void) | null;
  private doReject?: (err: any) => void;
  private task: ITask<T | Promise<T>> | null;

  constructor(public defaultDelay: number) {
    this.timeout = null;
    this.completionPromise = null;
    this.doResolve = null;
    this.task = null;
  }

  trigger(task: ITask<T | Promise<T>>, delay: number = this.defaultDelay): Promise<T> {
    this.task = task;
    this.cancelTimeout();
    if (!this.completionPromise) {
      this.completionPromise = new Promise((c, e) => {
        this.doResolve = c;
        this.doReject = e;
      }).then(() => {
        this.completionPromise = null;
        this.doResolve = null;
        const task = this.task!;
        this.task = null;
        return task();
      });
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.doResolve!(null);
    }, delay);
    return this.completionPromise;
  }

  isTriggered(): boolean {
    return this.timeout !== null;
  }

  cancel(): void {
    this.cancelTimeout();
    if (this.completionPromise) {
      this.doReject!(errors.canceled());
      this.completionPromise = null;
    }
  }

  dispose(): void {
    this.cancelTimeout();
  }

  private cancelTimeout(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

}

