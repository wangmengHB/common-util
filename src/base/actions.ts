import { IDisposable, Disposable } from './lifecycle';
import { Event, Emitter } from './event'

export interface ITelemetryData {
  from?: string;
  target?: string;
  [key: string]: any;
}

export interface IAction extends IDisposable {
  id: string;
  label: string;
  tooltip: string;
  class: string | undefined;
  enabled: boolean;
  checked: boolean;
  ratio: boolean;
  run(event?: any): Promise<any>;
}

export interface IRunEvent {
  action: IAction;
  result?: any;
  error?: any;
}

export interface IActionRunner extends IDisposable {
  run(action: IAction, context?: any): Promise<any>;
  onDidRun: Event<IRunEvent>;
  onDidBeforeRun: Event<IRunEvent>;
}

export interface IActionViewItem extends IDisposable {
  actionRunner: IActionRunner;
  setActionContext(context: any): void;
  render(element: HTMLElement): void;
  isEnabled(): boolean;
  focus(): void;
  blur(): void;
}

export interface IActionChangeEvent {
  label?: string;
  tooltip?: string;
  class?: string;
  enabled?: boolean;
  checked?: boolean;
  ratio?: boolean;
}

export class Action extends Disposable implements IAction {
  protected _onDidChange = this._register(new Emitter<IActionChangeEvent>());
  readonly onDidChange: Event<IActionChangeEvent> = this._onDidChange.event;

  protected _id: string;
  protected _label: string;
  protected _tooltip: string;
  protected _cssClass: string | undefined;
  protected _enabled: boolean;
  protected _checked: boolean;
  protected _ratio: boolean;
  protected _actionCallback?: (event?: any) => Promise<any>;

  constructor(id: string, label: string = '', cssClass: string = '', enabled: boolean = true, actionCallback?: (event?: any) => Promise<any>) {
    super();
    this._id = id;
    this._label = label;
    this._cssClass = cssClass;
    this._enabled = enabled;
    this._actionCallback = actionCallback;
  }

  get id(): string {
    return this._id;
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._setLabel(value);
  }

  get tooltip(): string {
    return this._tooltip;
  }

  set tooltip(value: string) {
    this._setTooltip(value);
  }

  get class(): string | undefined {
    return this._cssClass;
  }

  set class(value: string | undefined) {
    this._setClass(value);
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._setEnabled(value);
  }
  
  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    this._setChecked(value);
  }

  get ratio(): boolean {
    return this._ratio;
  }

  set ratio(value: boolean) {
    this._setRatio(value);
  }


  protected _setLabel(value: string): void {
    if (this._label !== value) {
      this._label = value;
      this._onDidChange.fire({label: value});
    }
  }

  protected _setTooltip(value: string) {
    if (this._tooltip !== value) {
      this._tooltip = value;
      this._onDidChange.fire({tooltip: value});
    }
  }

  protected _setClass(value: string | undefined) {
    if (this._cssClass !== value) {
      this._cssClass = value;
      this._onDidChange.fire({ class: value });
    }
  }

  protected _setEnabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      this._onDidChange.fire({ enabled: value});
    }
  }

  protected _setChecked(value: boolean) {
    if (this._checked !== value) {
      this._checked = value;
      this._onDidChange.fire({ checked: value});
    }
  }

  protected _setRatio(value: boolean) {
    if (this._ratio !== value) {
      this._ratio = value;
      this._onDidChange.fire({ ratio: value});
    }
  }

  run(event?: any, _data?: ITelemetryData): Promise<any> {
    if (this._actionCallback) {
      return this._actionCallback(event);
    }
    return Promise.resolve(true);
  }
}

export class ActionRunner extends Disposable implements IActionRunner {
  private _onDidBeforeRun = this._register(new Emitter<IRunEvent>());
  readonly onDidBeforeRun: Event<IRunEvent> = this._onDidBeforeRun.event;

  private _onDidRun = this._register(new Emitter<IRunEvent>());
  readonly onDidRun: Event<IRunEvent> = this._onDidRun.event;

  async run(action: IAction, context?: any): Promise<any> {
    if (!action.enabled) {
      return Promise.resolve(null);
    }
    this._onDidBeforeRun.fire({ action: action});
    try {
      const result = await this.runAction(action, context);
      this._onDidRun.fire({ action, result})
    } catch (error) {
      this._onDidRun.fire({ action, error});
    }
  }

  protected runAction(action: IAction, context?: any): Promise<any> {
    const res = context? action.run(context): action.run();
    return Promise.resolve(res);
  }
}

export class RadioGroup extends Disposable {
  constructor(readonly actions: Action[]) {
    super();
    for (const action of actions) {
      this._register(action.onDidChange(e => {
        if (e.checked && action.checked) {
          for (const candidate of actions) {
            if (candidate !== action) {
              candidate.checked = false;
            }
          }
        }
      }));
    }
  }

}