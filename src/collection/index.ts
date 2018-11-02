

export function getCombination(arr: Array = []): Array<Array> {
  if( arr.length <= 1) {
    return [arr];
  }
  let firstEl = arr[0];
  let prevResult = getCombination(arr.slice(1));
  let currentResult = prevResult.map(x => [].concat(firstEl, x));
  return [[firstEl]].concat(currentResult, prevResult);
}

export function getPermutation(arr = []) {
  if (arr.length <= 1) {
    return [arr];
  }
  let firstEl = arr[0];
  let leftPermutationRes = getPermutation(arr.slice(1));
  let res = [];

  leftPermutationRes.forEach( subArr => {
    for (let i = 0; i <= subArr.length; i++) {
      let newArr = subArr.slice(0);
      newArr.splice(i, 0, firstEl);
      res.push(newArr);
    }
  });
  return res;
}

export function getAllCombinationAndPermutation (arr = []) {
  let res = [];
  let comb = getCombination(arr);
  comb.forEach(item => {
    let perms = getPermutation(item);
    res = res.concat(perms);
  });
  res.sort((a, b) => b.length - a.length);
  return res;
}