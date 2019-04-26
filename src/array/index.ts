
/*
  计算一个数组内所有元素的组合可能，返回所有的结果是一个数组，包含所有可能组合的数组
  例如：['a', 'b'] --> [['a'], ['b'], ['a', 'b']]
*/

export function getAllCombination(source: Array<any> = []): Array<Array<any>> {
  if (!Array.isArray(source)) {
    return [];
  }
  const arr = uniqueArray(source);
  if (arr.length === 0) {
    return [];
  }
  if( arr.length === 1) {
    return [arr];
  }
  let firstEl = arr[0];
  let prevResult = getAllCombination(arr.slice(1));
  let currentResult = prevResult.map((x: any) => [].concat(firstEl, x));
  const res = [[firstEl]].concat(currentResult, prevResult);
  return res.sort((a: Array<any>, b: Array<any>) => a.length - b.length);
}

/*
  计算一个数组内全部元素的排列可能，返回所有的结果是一个数组，包含所有的排列可能
  例如：['a', 'b'] --> [['a', 'b'], ['b', 'a']]
*/
export function getPermutation(source: Array<any> = []) : Array<Array<any>> {
  if (!Array.isArray(source)) {
    return [];
  }
  const arr = uniqueArray(source);
  if (arr.length === 0) {
    return [];
  }
  if (arr.length === 1) {
    return [arr];
  }
  let firstEl = arr[0];
  let leftPermutationRes = getPermutation(arr.slice(1));
  let res: Array<any> = [];

  leftPermutationRes.forEach( subArr => {
    for (let i = 0; i <= subArr.length; i++) {
      let newArr = subArr.slice(0);
      newArr.splice(i, 0, firstEl);
      res.push(newArr);
    }
  });
  return res;
}

/*
  计算一个数组内所有元素的排列组合可能，返回所有的结果是一个数组，包含所有元素的排列组合
  例如： ['a', 'b'] --> [['a'], ['b'], ['a', 'b'], ['b', 'a']]
*/
export function getAllPermutation (source: Array<any> = []): Array<Array<any>> {
  if (!Array.isArray(source)) {
    return [];
  }
  const arr = uniqueArray(source);
  if (arr.length === 0) {
    return [];
  }
  if (arr.length === 1) {
    return [arr];
  }
  let res: Array<any> = [];
  let comb = getAllCombination(arr);
  comb.forEach((item: Array<any>) => {
    let perms = getPermutation(item);
    res = res.concat(perms);
  });
  res.sort((a:Array<any>, b: Array<any>) => a.length - b.length);
  return res;
}

/*
  数组去重, 并且去掉 null 和 undefined
*/
export function uniqueArray(arr: Array<any>) : Array<any> {
  let res: Array<any> = [];
  if (!Array.isArray(arr)) {
    return [];
  }
  for (let i = 0; i < arr.length; i++) {
    let el = arr[i];
    if (el !== null && el !== undefined && res.indexOf(el) === -1) {
      res.push(el);
    }
  }
  return res;
}


