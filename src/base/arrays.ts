import { CancellationToken } from './cancellation';
import { canceled } from './errors';
import { ISplice } from './sequence';

type Compare<T> = (a: T, b: T) => number;

interface IMutableSplice<T> extends ISplice<T> {
  deleteCount: number;
}

export function tail<T>(array: ArrayLike<T>, n: number = 0): T {
  return array[array.length - (1 + n)];
}

export function tail2<T>(arr: T[]): [T[], T] {
  if (arr.length === 0) {
    throw new Error('invalid tail call');
  }
  return [arr.slice(0, Attr.length - 1), arr[arr.length - 1]];
}

export function equals<T>(one: ReadonlyArray<T> | undefined, other: ReadonlyArray<T> | undefined, itemEquals: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
  if (one === other) {
    return true;
  }
  if (!one || !other) {
    return false;
  }
  if (one.length !== other.length) {
    return false;
  }
  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }
  return true;
}

export function binarySearch<T>(arr: ReadonlyArray<T>, key: T, comparator: (op1: T, op2: T) => number): number {
  let low = 0, high = arr.length - 1;
  while(low <= high) {
    const mid = ((low + high) / 2) | 0;   // 相当于 Math.floor
    const comp = comparator(arr[mid], key);
    if (comp < 0) {
      low = mid + 1;
    } else if (comp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -(low + 1);
}

/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
export function findFirstInSorted<T>(arr: ReadonlyArray<T>, p: (x: T) => boolean): number {
  let low = 0, high = arr.length;
  if (high === 0) {
    return 0;
  }
  while(low < high) {
    const mid = Math.floor((low + high) / 2);
    if (p(arr[mid])) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

/**
 * Like `Array#sort` but always stable. Usually runs a little slower `than Array#sort`
 * so only use this when actually needing stable sort.
 */
export function mergeSort<T>(data: T[], compare: Compare<T>): T[] {
  _sort(data, compare, 0, data.length - 1, []);
  return data;
}

function _sort<T>(a: T[], compare: Compare<T>, lo: number, hi: number, aux: T[]) {
  if (hi <= lo) {
    return;
  }
  const mid = lo + ((hi - lo)/ 2) | 0;
  _sort(a, compare, lo, mid, aux);
  _sort(a, compare, mid + 1, hi, aux);
  if (compare(a[mid], a[mid + 1])) {
    return;
  }
  _merge(a, compare, lo, mid, hi, aux);
}

function _merge<T>(a: T[], compare: Compare<T>, lo: number, mid: number, hi: number, aux: T[]): void {
  let leftIdx = lo, rightIdx = mid + 1;
  for (let i = lo; i <= hi; i++) {
    aux[i] = a[i];
  }
  for (let i = lo; i <= hi; i++) {
    if (leftIdx > mid) {
      a[i] = aux[rightIdx++];
    } else if (rightIdx > hi) {
      a[i] = aux[leftIdx++];
    } else if (compare(aux[rightIdx], aux[leftIdx]) < 0) {
      a[i] = aux[rightIdx++];
    } else {
      a[i] = aux[leftIdx++];
    }
  }
}

export function groupBy<T>(data: ReadonlyArray<T>, compare: (a: T, b: T) => number): T[][] {
  const result: T[][] = [];
  let currentGroup: T[] | undefined;
  for (const element of mergeSort(data.slice(0), compare)) {
    if (!currentGroup || compare(currentGroup[0], element) !== 0 ) {
      currentGroup = [element];
      result.push(currentGroup);
    } else {
      currentGroup.push(element);
    }
  }
  return result;
}

/**
 * Diffs two *sorted* arrays and computes the splices which apply the diff.
 */
export function sortedDiff<T>(before: ReadonlyArray<T>, after: ReadonlyArray<T>, compare: (a: T, b: T) => number): ISplice<T>[] {
  const result: IMutableSplice<T>[] = [];
  function pushSplice(start: number, deleteCount: number, toInsert: T[]): void {
    if (deleteCount === 0 && toInsert.length === 0) {
      return;
    }
    const latest = result[result.length - 1];
    if (latest && latest.start + latest.deleteCount === start) {
      latest.deleteCount += deleteCount;
      latest.toInsert.push(...toInsert);
    } else {
      result.push({start, deleteCount, toInsert});
    }
  }
  let beforeIdx = 0;
  let afterIdx = 0;
  while(true) {
    if (beforeIdx === before.length) {
      pushSplice(beforeIdx, 0, after.slice(afterIdx));
      break;
    }
    if (afterIdx === after.length) {
      pushSplice(beforeIdx, before.length - beforeIdx, []);
      break;
    }
    const beforeElement = before[beforeIdx];
    const afterElement = after[afterIdx];
    const n = compare(beforeElement, afterElement);
    if (n === 0) {
      beforeIdx += 1;
      afterIdx += 1;
    } else if ( n < 0) {
      pushSplice(beforeIdx, 1, []);
      beforeIdx += 1;
    } else if ( n > 0) {
      pushSplice(beforeIdx, 0, [afterElement]);
      afterIdx += 1;
    }
  }
  return result;
}

/**
 * Takes two *sorted* arrays and computes their delta (removed, added elements).
 * Finishes in `Math.min(before.length, after.length)` steps.
 */
export function delta<T>(before: ReadonlyArray<T>, after: ReadonlyArray<T>, compare: (a: T, b: T) => number): {removed: T[], added: T[]} {
  const splices = sortedDiff(before, after, compare);
  const removed: T[] = [];
  const added: T[] = [];
  for (const splice of splices) {
    removed.push(...before.slice(splice.start + splice.deleteCount));
    added.push(...splice.toInsert);
  }
  return { removed, added};
}

/**
 * Returns the top N elements from the array.
 *
 * Faster than sorting the entire array when the array is a lot larger than N.
 *
 * @param array The unsorted array.
 * @param compare A sort function for the elements.
 * @param n The number of elements to return.
 * @return The first n elemnts from array when sorted with compare.
 */
export function top<T>(arr: ReadonlyArray<T>, compare: (a: T, b: T) => number, n: number): T[] {
  if (n === 0) {
    return [];
  }
  const result = arr.slice(0, n).sort(compare);
  topStep(arr, compare, result, n, arr.length);
  return result;
}

function topStep<T>(arr: ReadonlyArray<T>, compare: (a: T, b: T) => number, result: T[], i: number, m: number): void {
  for (const n = result.length; i < m; i++) {
    const element = arr[i];
    if (compare(element, result[n - 1]) < 0 ) {
      result.pop();
      const j = findFirstInSorted(result, e => compare(element, e) < 0);
      result.splice(j, 0, element);
    }
  }
}

/**
 * Asynchronous variant of `top()` allowing for splitting up work in batches between which the event loop can run.
 *
 * Returns the top N elements from the array.
 *
 * Faster than sorting the entire array when the array is a lot larger than N.
 *
 * @param array The unsorted array.
 * @param compare A sort function for the elements.
 * @param n The number of elements to return.
 * @param batch The number of elements to examine before yielding to the event loop.
 * @return The first n elemnts from array when sorted with compare.
 */
export function topAsync<T>(arr: T[], compare: (a: T, b: T) => number, n: number, batch: number, token?: CancellationToken): Promise<T[]> {
  if (n === 0) {
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    (async () => {
      const o = arr.length;
      const result = arr.slice(0, n).sort(compare);
      for (let i = n, m = Math.min(n + batch, o); i < o; i = m, m = Math.min(m + batch, o)) {
        if (i > n) {
          await new Promise(resolve => setTimeout(resolve));
        }
        if (token && token.isCancellationRequested) {
          throw canceled();
        }
        topStep(arr, compare, result, i, m);
      }
      return result;
    })().then(resolve, reject)
  });
}

export function coalesce<T>(arr: ReadonlyArray<T|undefined|null>): T[] {
  if (!arr) {
    return arr;
  }
  return arr.filter(e => !!e) as T[];
}

export function coalesceInPlace<T>(arr: Array<T|undefined|null>): void {
  if (!arr) {
    return;
  }
  let to = 0;
  for (let i = 0; i < arr.length; i++) {
    if (!!arr[i]) {
      arr[to] = arr[i];
      to += 1;
    }
  }
  arr.length = to;
}

export function move(arr: any[], from: number, to: number): void {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
}

export function distinct<T>(arr: ReadonlyArray<T>): T[] {
  const seen = new Set<T>();
  return arr.filter(element => {
    if (seen.has(element)) {
      return false;
    }
    seen.add(element);
    return true;
  })
}

export function uniqueFilter<T>(keyFn: (t: T) => string): (t: T) => boolean {
  const seen = new Set<string>();
  return ( element ) => {
    const key = keyFn(element);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }
}

export function lastIndex<T>(arr: ReadonlyArray<T>, fn: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    const element = arr[i];
    if (fn(element)) {
      return i;
    }
  }
  return -1;
}

export function firstIndex<T>(arr: ReadonlyArray<T>, fn: (item: T) => boolean): number {
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (fn(element)) {
      return i;
    }
  }
  return -1;
}

export function first<T>(array: ReadonlyArray<T>, fn: (item: T) => boolean, notFoundValue: T): T;
export function first<T>(array: ReadonlyArray<T>, fn: (item: T) => boolean): T | undefined;
export function first<T>(array: ReadonlyArray<T>, fn: (item: T) => boolean, notFoundValue: T | undefined = undefined): T | undefined {
	const index = firstIndex(array, fn);
	return index < 0 ? notFoundValue : array[index];
}

export function commonPrefixLength<T>(one: ReadonlyArray<T>, other: ReadonlyArray<T>, equals: (a: T, b: T) => boolean = (a, b) => a === b): number {
  let result = 0;
  for (let i = 0, len = Math.min(one.length, other.length); i < len && equals(one[i], other[i]); i++) {
    result++;
  }
  return result;
}

export function flatten<T>(arr: T[][]): T[] {
  return (<T[]>[]).concat(...arr);
}

export function range(to: number): number[];
export function range(from: number, to: number): number[];
export function range(arg: number, to?: number): number[] {
  let from: number;
  if (typeof to === 'number') {
    from = arg;
  } else {
    from = 0;
    to = arg;
  }
  const result: number[] = [];
  if (from <= to) {
    for (let i = from; i < to; i++) {
      result.push(i);
    }
  } else {
    for (let i = from; i > to; i--) {
      result.push(i);
    }
  }
  return result;
}

export function fill<T>(num: number, value: T, arr: T[] = []): T[] {
  for (let i = 0; i < num; i++) {
    arr[i] = value;
  }
  return arr;
}

export function index<T>(array: ReadonlyArray<T>, indexer: (t: T) => string): { [key: string]: T; };
export function index<T, R>(array: ReadonlyArray<T>, indexer: (t: T) => string, merger?: (t: T, r: R) => R): { [key: string]: R; };
export function index<T, R>(array: ReadonlyArray<T>, indexer: (t: T) => string, merger: (t: T, r: R) => R = t => t as any): { [key: string]: R; } {
	return array.reduce((r, t) => {
		const key = indexer(t);
		r[key] = merger(t, r[key]);
		return r;
	}, Object.create(null));
}

/**
 * Uses Fisher-Yates shuffle to shuffle the given array
 */
export function shuffle<T>(array: T[], _seed?: number): void {
	let rand: () => number;

	if (typeof _seed === 'number') {
		let seed = _seed;
		// Seeded random number generator in JS. Modified from:
		// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
		rand = () => {
			const x = Math.sin(seed++) * 179426549; // throw away most significant digits and reduce any potential bias
			return x - Math.floor(x);
		};
	} else {
		rand = Math.random;
	}

	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rand() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

/**
 * Pushes an element to the start of the array, if found.
 */
export function pushToStart<T>(arr: T[], value: T): void {
	const index = arr.indexOf(value);

	if (index > -1) {
		arr.splice(index, 1);
		arr.unshift(value);
	}
}

/**
 * Pushes an element to the end of the array, if found.
 */
export function pushToEnd<T>(arr: T[], value: T): void {
	const index = arr.indexOf(value);

	if (index > -1) {
		arr.splice(index, 1);
		arr.push(value);
	}
}

export function find<T>(arr: ArrayLike<T>, predicate: (value: T, index: number, arr: ArrayLike<T>) => any): T | undefined {
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];
		if (predicate(element, i, arr)) {
			return element;
		}
	}
	return undefined;
}

export function mapArrayOrNot<T, U>(items: T | T[], fn: (_: T) => U): U | U[] {
	return Array.isArray(items) ?
		items.map(fn) :
		fn(items);
}

export function asArray<T>(x: T | T[]): T[] {
	return Array.isArray(x) ? x : [x];
}
