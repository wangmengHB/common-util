import Dep from "./Dep";
import { linkProto, isObject, hasOwn, isPlainObject, equal, def } from "../util";
import { arrayMethods } from "./array";

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)


export default class Observer {
    constructor (value) {
        this.value = value
        this.dep = new Dep()
        this.vmCount = 0
        def(value, '__ob__', this)
        if (Array.isArray(value)) {
            linkProto(value, arrayMethods, arrayKeys)
            this.observeArray(value)
        } else {
            this.walk(value)
        }
    }

    walk (obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i])
        }
    }

    observeArray (arr) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(arr[i])
        }
    }

}

export function observe (value, asRootData = false) {
    if (!isObject(value)) {
        return
    }
    let ob
    if (hasOwn(value, '__ob__') &&
        value.__ob__ instanceof Observer
    ) {
        ob = value.__ob__
    } else if ((Array.isArray(value) || isPlainObject(value)) &&
        Object.isExtensible(value)
    ) {
        ob = new Observer(value)
    }
    if (asRootData && ob) {
        ob.vmCount++
    }
    return ob
}


export function defineReactive (obj, key, val, shallow = false) {
    const dep = new Dep()
    const property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) {
        return
    }
    const getter = property && property.get
    const setter = property && property.set
    if ((arguments.length === 2) &&
        (!getter || setter)
    ) {
        val = obj[key]
    }

    let childOb = !shallow && observe(val)

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            const value = getter? getter.call(obj): val
            if (Dep.target) {
                dep.depend()
                if (childOb) {
                    childOb.dep.depend()
                    if (Array.isArray(value)) {
                        dependArray(value)
                    }
                }
            }
            return value

        },
        set: function reactiveSetter (newVal) {
            const value = getter? getter.call(obj): val
            if (equal(newVal, val)) {
                return
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()
        }
    })
}

function dependArray (value) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i]
        if (e && e.__ob__) {
            e.__ob__.dep.depend()
        }
        if (Array.isArray(e)) {
            dependArray(e)
        }
    }
}