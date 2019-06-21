import { INavigator, ArrayNavigator } from './iterator';

export class HistoryNavigator<T> implements INavigator<T> {
  private _history: Set<T>;
  private _limit: number;
  private _navigator: ArrayNavigator<T>;

  constructor(history: T[] = [], limit: number = 10) {
    this._initialize(history);
    this._limit = limit;
    this._onChange();
  }

  getHistory(): T[] {
    return this._elements;
  }

  add(t: T) {
    this._history.delete(t);
    this._history.add(t);
    this._onChange();
  }

  next(): T | null {
    return this._navigator.next();
  }

  previous(): T | null {
    return this._navigator.previous();
  }

  current(): T | null {
    return this._navigator.current();
  }

  parent(): null {
    return null;
  }

  first(): T | null {
    return this._navigator.first();
  }

  last(): T | null {
    return this._navigator.last();
  }

  has(t: T): boolean {
    return this._history.has(t);
  }

  clear(): void {
    this._initialize([]);
    this._onChange();
  }

  private _initialize(history: T[]): void {
    this._history = new Set();
    for (const entry of history) {
      this._history.add(entry);
    }
  }

  private _reduceToLimit() {
    const data = this._elements;
    if (data.length > this._limit) {
      this._initialize(data.slice(data.length - this._limit));
    }
  }

  private _onChange() {
    this._reduceToLimit();
    this._navigator = new ArrayNavigator(this._elements, 0, this._elements.length);
  }

  private get _elements(): T[] {
    const elements: T[] = [];
    this._history.forEach(e => elements.push(e));
    return elements;
  }

}
