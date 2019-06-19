import { once } from './functional';

export interface IDisposable {
  dispose(): void;
}

export function isDisposable<E extends object>(thing: E): thing is E & IDisposable {
  return typeof (<IDisposable><any>thing).dispose === 'function' &&
    (<IDisposable><any>thing).dispose.length === 0;
}

export function dispose<T extends IDisposable>(disposable: T): T;
export function dispose<T extends IDisposable>(disposable: T | undefined): T | undefined;
export function dispose<T extends IDisposable>(disposables: T[]): T[];
export function dispose<T extends IDisposable>(disposables: ReadonlyArray<T>): ReadonlyArray<T>;
export function dispose<T extends IDisposable>(disposables: T | T[] | undefined): T | T[] | undefined {
  if (Array.isArray(disposables)) {
    disposables.forEach(d => d && d.dispose());
    return [];
  } else if (disposables) {
    disposables.dispose();
    return disposables;
  } else {
    return undefined;
  }
}

export function combinedDisposable(...disposables: IDisposable[]): IDisposable {
  return {
    dispose: () => { dispose(disposables); }
  };
}

export function toDisposable(fn: () => void): IDisposable {
  return {
    dispose: fn
  };
}

export class DisposableStore implements IDisposable {
  private _toDispose = new Set<IDisposable>();
  private _isDisposed = false;

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this.clear();
  }

  public clear(): void {
    this._toDispose.forEach(item => item.dispose());
    this._toDispose.clear();
  }

  public add<T extends IDisposable>(t: T): T {
    if (!t) {
      return t;
    }
    if ((t as any as DisposableStore) === this) {
      throw new Error('Cannot register a disposable on itself!');
    }
    if (this._isDisposed) {
      console.warn(new Error('Registering disposable on object that has already been disposed of').stack);
      t.dispose();
    } else {
      this._toDispose.add(t);
    }
    return t;
  }

}

export abstract class Disposable implements IDisposable {
  static None = Object.freeze<IDisposable>({ dispose() {}});
  private readonly _store = new DisposableStore();

  public dispose(): void {
    this._store.dispose();
  }

  protected _register<T extends IDisposable>(t: T): T {
    if ((t as any as Disposable) === this) {
      throw new Error('Cannot register a disposable on itself!')
    }
    return this._store.add(t);
  }
}

export class MutableDisposable<T extends IDisposable> implements IDisposable {
  private _value?: T;
  private _isDisposed = false;

  get value(): T | undefined {
    return this._isDisposed? undefined: this._value;
  }

  set value(value: T | undefined) {
    if (this._isDisposed || value === this._value) {
      return;
    }
    if (this._value) {
      this._value.dispose();
    }
    this._value = value;
  }

  clear() {
    this.value = undefined;
  }

  dispose() {
    this._isDisposed = true;
    if (this._value) {
      this._value.dispose();
    }
    this._value = undefined;
  }

}

export interface IReference<T> extends IDisposable {
  readonly object: T;
}

export abstract class ReferenceCollection<T> {
  private references: Map<string, { readonly object: T; counter: number;}> = new Map();

  acquire(key: string): IReference<T> {
    let reference = this.references.get(key);
    if(!reference) {
      reference = { counter: 0, object: this.createReferencedObject(key)};
      this.references.set(key, reference);
    }
    const { object } = reference;
    const dispose = once(() => {
      if (--reference!.counter === 0) {
        this.destroyReferencedObject(key, reference!.object);
        this.references.delete(key);
      }
    });
    reference.counter++;

    return { object, dispose };
  }

  protected abstract createReferencedObject(key: string): T;
  protected abstract destroyReferencedObject(key: string, object: T): void;
}

export class ImmortalReference<T> implements IReference<T> {
  constructor(public object: T) {}
  dispose(): void {}
}



