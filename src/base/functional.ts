
export function once<T extends Function>(this: any, fn: T): T {
  const _this = this;
  let called = false;
  let result: any;

  return function() {
    if (called) {
      return result;
    }
    called = true;
    result = fn.apply(_this, arguments);
    return result;
  } as any as T;

}
