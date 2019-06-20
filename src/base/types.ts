const _typeof = {
  number: 'number',
  string: 'string',
  undefined: 'undefined',
  object: 'object',
  function: 'function'
};

export function isString(str: any): str is string {
  if (typeof str === _typeof.string) {
    return true;
  }
  return false;
}

export function isNumber(obj: any): obj is number {
  if (typeof obj === _typeof.number && !isNaN(obj)) {
    return true;
  }
  return false;
}

export function isBoolean(obj: any): obj is boolean {
  return obj === true || obj === false;
}

export function isUndefined(obj: any): obj is undefined {
  return typeof obj === _typeof.undefined;
}

export function isUndefinedOrNull(obj: any): obj is undefined | null {
  return isUndefined(obj) || obj === null;
}

export function isFunction(obj: any): obj is Function {
  return typeof obj === _typeof.function;
}

export function areFunctions(...objects: any[]): boolean {
  return objects.length > 0 && objects.every(isFunction);
}

export function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && (<any[]>value).every(str => isString(str));
}

export function isObject(obj: any): obj is Object {
  return typeof obj === _typeof.object
    && obj !== null
    && !Array.isArray(obj)
    && !(obj instanceof RegExp)
    && !(obj instanceof Date);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function isEmptyObject(obj: any): obj is any {
  if (!isObject(obj)) {
    return false;
  }
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

export type TypeConstraint = string | Function;

export function validateConstraint(arg: any, constraint: TypeConstraint | undefined): void {
  if (isString(constraint)) {
    if (typeof arg !== constraint) {
      throw new Error(`argument does not match constraint: typeof ${constraint}`)
    }
  } else if (isFunction(constraint)) {
    try {
      if (arg instanceof constraint) {
        return;
      }
    } catch {

    }
    // 字面值类型走这个判断
    if (!isUndefinedOrNull(arg) && arg.constructor === constraint) {
      return;
    }
    if (constraint.length === 1 && constraint.call(undefined, arg) === true) {
      return;
    }
    throw new Error(`argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true`);
  }
}

export function validateConstraints(args: any[], constraints: Array<TypeConstraint | undefined>): void {
  const len = Math.min(args.length, constraints.length);
  if (args.length !== constraints.length) {
    throw new Error('validateConstraints: args.length not equal constraints.length');
  }
  for (let i = 0; i < len; i++) {
    validateConstraint(args[i], constraints[i]);
  }
}

export function withNullAsUndefined<T>(x: T | null): T | undefined {
  return x === null? undefined: x;
}

export function withUndefinedAsNull<T>(x: T | undefined): T | null {
  return isUndefined(x)? null: x;
}

// 这个方法有缺陷，只能返回原型链上的属性名称 ！！！
export function getAllPropertyNames(obj: object): string[] {
  let res: string[] = [];
  let proto = Object.getPrototypeOf(obj);
  while(Object.prototype !== proto) {
    res = res.concat(Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
  }
  return res;
}
