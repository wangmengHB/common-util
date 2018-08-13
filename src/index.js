// test case

import {defineReactive, observe, Watcher} from './observer'



let obj = {
    x: 56,
    y: 78,
    z: 20
}
window.__test = obj

observe(obj)