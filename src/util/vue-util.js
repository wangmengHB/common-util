
/**
 * Generate a static keys string from compiler modules.
 */
export function genStaticKeys(modules) {
    return modules.reduce((keys, m) => {
        return keys.concat(m.staticKeys || [])
    }, []).join(',')
}


/**
 * Check if a string starts with $ or _
 */
export function isReserved (str) {
    const c = (str + '').charCodeAt(0)
    return c === 0x24 || c === 0x5F
}


/**
 * Parse simple path.
 * 
 * 这个函数的作用是为了获取一个很深路径的对象的属性值：
 * let obj = {a:{b:{c:{d:[1,2,3,4]}}}}
 * let getter = parsePath('a.b.c.d')
 * let val = getter(obj)   // [1,2,3,4]
 * 
 */
const bailRE = /[^\w.$]/
export function parsePath (path) {
    if (bailRE.test(path)) {
        return
    }
    const segments = path.split('.')
    return function (obj) {
        for (let i = 0; i < segments.length; i++) {
            if (!obj) {
                return
            } 
            obj = obj[segments[i]]
        }
        return obj
    }
}
  