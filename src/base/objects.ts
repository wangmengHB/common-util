import { isObject, isUndefinedOrNull } from './types';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof RegExp) {
    return obj as any;
  }
  const result: any = Array.isArray(obj)? []: {};
  Object.keys(obj as any).forEach((key: string) => {
		if ((<any>obj)[key] && typeof (<any>obj)[key] === 'object') {
			result[key] = deepClone((<any>obj)[key]);
		} else {
			result[key] = (<any>obj)[key];
		}
	});
  return result;
}

export function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const stack: any[] = [obj];
  while(stack.length > 0) {
    const obj = stack.shift();
    Object.freeze(obj);
    for (const key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        const prop = obj[key];
        if (typeof prop === 'object' && !Object.isFrozen(prop)) {
          stack.push(prop);
        }
      }
    }
  }
  return obj;
}

export function cloneAndChange(obj: any, changer: (orig: any) => any ): any {
  return _cloneAndChange(obj, changer, new Set());
}

function _cloneAndChange(obj: any, changer: (orig: any) => any, seen: Set<any>): any {
  if (isUndefinedOrNull(obj)) {
    return obj;
  }
  const changed = changer(obj);
  if (typeof changed !== 'undefined') {
    return changed;
  }

  if (Array.isArray(obj)) {
    const r1: any[] = [];
    for (const e of obj) {
      r1.push(_cloneAndChange(e, changer, seen));
    }
    return r1;
  }

  if (isObject(obj)) {
    if (seen.has(obj)) {
      throw new Error('Cannot clone recursive data-structure');
    }
    seen.add(obj);
    const r2 = {};
    for (let i2 in obj) {
      if (hasOwnProperty.call(obj, i2)) {
        (<any>r2)[i2] = _cloneAndChange(obj[i2], changer, seen);
      }
    }
    seen.delete(obj);
    return r2; 
  }

  return obj;
}

/**
 * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
 * if existing properties on the destination should be overwritten or not. Defaults to true (overwrite).
 */
export function mixin(destination: any, source: any, overwrite: boolean = true): any {
  if (!isObject(destination)) {
    return source;
  }
  if (isObject(source)) {
    Object.keys(source).forEach(key => {
      if (key in destination) {
        if (overwrite) {
          if (isObject(destination[key]) && isObject(source[key])) {
            mixin(destination[key], source[key], overwrite);
          } else {
            destination[key] = source[key];
          }
        } else {
          // do nothing
        }
      } else {
        destination[key] = source[key];
      }
    })
  }
  return destination;
}

export function assign(destination: any, ...sources: any[]): any {
  sources.forEach(source => source && Object.keys(source).forEach(key => destination[key] = source[key]));
  return destination;
}

export function equals(one: any, other: any): boolean {
  if (one === other) {
    return true;
  }
  if (one === null || one === undefined || other === null || other === undefined) {
    return false;
  }
  if (typeof one !== typeof other) {
    return false;
  }
  if (Array.isArray(one) !== Array.isArray(other)) {
    return false;
  }
  if (typeof one !== 'object') {
    return false;
  }

  if (Array.isArray(one)) {
    if (one.length !== other.length) {
      return false;
    }
    for (let i = 0; i < one.length; i++) {
      if (!equals(one[i], other[i])) {
        return false;
      }
    }
  } else {
    const oneKeys: string[] = [];
    for (const key in one) {
      oneKeys.push(key);
    }
    oneKeys.sort();
    const otherKeys: string[] = [];
    // 这种写法比较了原型链上的属性，如果使用 Object.keys(), 则只比较自己的属性
    for (const key in other) {
      otherKeys.push(key);
    }
    otherKeys.sort();
    if (!equals(oneKeys, otherKeys)) {
      return false;
    }
    for (let i = 0; i < oneKeys.length; i++) {
      if (!equals(one[oneKeys[i]], other[oneKeys[i]])) {
        return false;
      }
    }
  }
  return true;
}

export function safeStringify(obj: any): string {
  const seen: any[] = [];
  return JSON.stringify(obj, (key, value) => {
    if (isObject(value) || Array.isArray(value)) {
      if (seen.indexOf(value) !== -1) {
        return '[Circular]';
      } else {
        seen.push(value);
      }
    }
    return value;
  });
}

export function getOrDefault<T, R>(obj: T, fn: (obj: T) => R | undefined, defaultValue: R): R {
  const result = fn(obj);
  return typeof result === 'undefined'? defaultValue: result;
}

type obj = { [key: string]: any;};

// 只能获取平铺对象的差异。
export function distinct(base: obj, target: obj): obj {
  const result = Object.create(null);
  if (!base || !target) {
    return result;
  }
  const targetKeys = Object.keys(target);
  targetKeys.forEach(k => {
    const baseValue = base[k];
    const targetValue = target[k];
    if (!equals(baseValue, targetValue)) {
      result[k] = targetValue;
    }
  })

  return result;
}

