import { compact, getCombination, getPermutation, getAllCombinationAndPermutation} from '../src/array/index';
import { factorial } from '../src/helper';


describe('array', () => {
  it('compact array', () => {
    const source = [1,2,3,null,,5,6,7, undefined, 1,2,3,,,,7];
    const target = [1,2,3,5,6,7];

    expect(compact(source)).toEqual(target);

    

  });


  it('getCombination', () => {
    const source = ['a', 'b', 'c', 'd'];
    const res = getCombination(source);

    expect(res).toContainEqual(['a']);
    expect(res).toContainEqual(['b']);
    expect(res).toContainEqual(['c']);
    expect(res).toContainEqual(['d']);
    expect(res).toContainEqual(['a', 'b']);
    expect(res).toContainEqual(['a', 'c']);
    expect(res).toContainEqual(['a', 'd']);
    expect(res).toContainEqual(['b', 'c']);
    expect(res).toContainEqual(['b', 'd']);
    expect(res).toContainEqual(['c', 'd']);
    expect(res).toContainEqual(['a', 'b', 'c']);
    expect(res).toContainEqual(['a', 'b', 'd']);
    expect(res).toContainEqual(['a', 'c', 'd']);
    expect(res).toContainEqual(['b', 'c', 'd']);
    expect(res).toContainEqual(['a', 'b', 'c', 'd']);
    
  });

  


  it('getPermutation', () => {
    const source = ['a', 'b', 'c', 'd'];
    const res = getPermutation(source);

    // 每个组合的长度应该和有效元素数量一致
    expect(res.every(item => item.length === source.length)).toBe(true);
    // 每个有效元素应该都存在于排列中
    expect(res.every(item => {
      let res = true;
      for (let i = 0; i < source.length; i++ ) {
        if (item.indexOf(source[i]) === -1) {
          res = false;
          break;
        }
      }
      return res;
    })).toBe(true);
    // 每个排列应该应该各不相同
    expect(compact(res.map(item => item.join(''))).length).toEqual(res.length);
    // 排列的个数应该为 n！
    expect(res.length).toEqual(factorial(source.length));
    
  });


  it('getAllCombinationAndPermutation', () => {
    const source = ['a', 'b', 'c', 'd'];
    const res = getAllCombinationAndPermutation(source);
    console.log(res);

    let supposedLength = source.length;
    for (let i = source.length; i > 0; i-- ) {
      let total = i;
      for (let j = total - 1; j > 0; j--) {
        supposedLength += factorial(total) /(factorial(j));
      }
    }



    expect(res.length).toEqual(supposedLength);




  });




})


