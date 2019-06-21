
export interface IStringDictionary<V> {
  [name: string]: V;
}

export interface INumberDictionary<V> {
  [idex: number]: V;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function values<T>(from: IStringDictionary<T> | INumberDictionary<T>): T[] {
  const result: T[] = [];
  for (let key in from) {
    if (hasOwnProperty.call(from, key)) {
      result.push((<any>from)[key]);
    }
  }
  return result;
}

export function size<T>(from: IStringDictionary<T> | INumberDictionary<T>): number {
  let count = 0;
  for (let key in from ) {
    if (hasOwnProperty.call(from, key)) {
      count += 1;
    }
  }
  return count;
}

export function first<T>(from: IStringDictionary<T> | INumberDictionary<T>): T | undefined {
  for (let key in from) {
    if (hasOwnProperty.call(from, key)) {
      return (<any>from)[key];
    }
  }
  return undefined;
}

/**
 * Iterates over each entry in the provided set. The iterator allows
 * to remove elements and will stop when the callback returns {{false}}.
 */
export function forEach<T>(from: IStringDictionary<T> | INumberDictionary<T>, callback: (entry: {key: any; value: T;}, remove: () => void) => any): void {
  for (let key in from ) {
    if (hasOwnProperty.call(from, key)) {
      const result = callback({key: key, value: (<any>from)[key]}, function() {
        delete (<any>from)[key];
      });
      if (result === false) {
        return;
      }
    }
  }
}

export function groupBy<T>(data: T[], groupFn: (element: T) => string): IStringDictionary<T[]> {
  const result: IStringDictionary<T[]> = Object.create(null);
  for (const element of data) {
    const key = groupFn(element);
    let target = result[key];
    if (!target) {
      target = result[key] = [];
    }
    target.push(element);
  }
  return result;
}

export function fromMap<T>(original: Map<string, T>): IStringDictionary<T> {
  const result: IStringDictionary<T> = Object.create(null);
  if (original) {
    original.forEach((value, key) => {
      result[key] = value;
    })
  }
  return result;
}

export class SetMap<K, V> {
  private map = new Map<K, Set<V>>();

  add(key: K, value: V): void {
    let values = this.map.get(key);
    if (!values) {
      values = new Set<V>();
      this.map.set(key, values);
    }
    values.add(value);
  }

  delete(key: K, value: V): void {
    const values = this.map.get(key);
    if (!values) {
      return;
    }
    values.delete(value);
    if (values.size === 0) {
      this.map.delete(key);
    }
  }

  forEach(key: K, fn: (value: V) => void): void {
    const values = this.map.get(key);
    if (!values) {
      return;
    }
    values.forEach(fn);
  }

}


