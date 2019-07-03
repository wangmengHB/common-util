import { Emitter, Event } from './event';
import { IDisposable } from './lifecycle';

export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  readonly onCancellationRequested: Event<any>;
}

const shortcutEvent = Object.freeze(function(callback, context?): IDisposable {
  const handle = setTimeout(callback.bind(context), 0);
  return { dispose () { clearTimeout(handle);}}
} as Event<any>);


export namespace CancellationToken {

  export const None: CancellationToken = Object.freeze({
    isCancellationRequested: false,
		onCancellationRequested: Event.None
  });

  export const Cancelled: CancellationToken = Object.freeze({
    isCancellationRequested: true,
		onCancellationRequested: shortcutEvent
  });

  export function isCancellationToken(thing: any): thing is CancellationToken {
    if (thing === CancellationToken.None || thing === CancellationToken.Cancelled) {
      return true;
    }
    if (thing instanceof MutableToken) {
      return true;
    }
    if (!thing || typeof thing !== 'object') {
      return false;
    }
    return typeof (thing as CancellationToken).isCancellationRequested === 'boolean'
			&& typeof (thing as CancellationToken).onCancellationRequested === 'function';
  }

}

class MutableToken implements CancellationToken {
  private _isCancelled: boolean = false;
  private _emitter: Emitter<any> | null = null;

  cancel() {
    if (!this._isCancelled) {
      this._isCancelled = true;
      if (this._emitter) {
        this._emitter.fire(undefined);
        this.dispose();
      }
    }
  }

  dispose() {
    if (this._emitter) {
      this._emitter.dispose();
      this._emitter = null;
    }
  }

  get isCancellationRequested(): boolean {
    return this._isCancelled;
  }
  
  get onCancellationRequested(): Event<any> {
    if (this._isCancelled) {
      return shortcutEvent;
    }
    if (!this._emitter) {
      this._emitter = new Emitter<any>();
    }
    return this._emitter.event;
  }

}

export class CancellationTokenSource {
  private _token?: CancellationToken = undefined;
  private _parentListener?: IDisposable = undefined;

  constructor(parent?: CancellationToken) {
    if (parent) {
      this._parentListener = parent.onCancellationRequested(this.cancel, this);
    }
  }

  get token(): CancellationToken {
    if (!this._token) {
      this._token = new MutableToken();
    }
    return this._token;
  }

  cancel(): void {
    if (!this._token) {
      this._token = CancellationToken.Cancelled;
    } else if ( this._token instanceof MutableToken) {
      this._token.cancel();
    }
  }

  dispose(): void {
    if (this._parentListener) {
      this._parentListener.dispose();
    }
    if (!this._token) {
      this._token = CancellationToken.None;
    } else if (this._token instanceof MutableToken) {
      this._token.dispose();
    }
  }

}




