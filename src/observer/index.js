/* @flow */

import Dep from './Dep'
import Watcher from './Watcher'
import Observer, {observe, defineReactive} from './Observer'
import {
  def,
  hasOwn,
  linkProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
} from '../util/index'




export {
    Dep,
    Watcher,
    Observer,
    observe,
    defineReactive
}







/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target, key, val) {
    if ( (isUndef(target) || isPrimitive(target))) {
        console.error(`Cannot set reactive property on undefined, null, or primitive value: ${target}`)
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
    }
    if (key in target && !(key in Object.prototype)) {
        target[key] = val
        return val
    }
    const ob = target.__ob__
    if ((ob && ob.vmCount)) {
        console.error(
        `Avoid adding reactive properties to a Vue instance 
        or its root $data 
        at runtime - declare it upfront in the data option.`
        )
        return val
    }
    if (!ob) {
        target[key] = val
        return val
    }
    defineReactive(ob.value, key, val)
    ob.dep.notify()
    return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target, key) {
    if ((isUndef(target) || isPrimitive(target))) {
        console.error(
            `Cannot delete reactive property on 
            undefined, null, or primitive value: ${target}`
        )
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.splice(key, 1)
        return
    }
    const ob = target.__ob__
    if ((ob && ob.vmCount)) {
        console.error(
        'Avoid deleting properties on a Vue instance or its root $data ' +
        '- just set it to null.'
        )
        return
    }
    if (!hasOwn(target, key)) {
        return
    }
    delete target[key]
    if (!ob) {
        return
    }
    ob.dep.notify()
}


