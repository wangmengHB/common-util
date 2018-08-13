// test case

import {defineReactive, observe} from './observer'
import Watcher from './observer/Watcher'


function createWatcher (vm, expOrFn, handler) {
    const watcher = new Watcher(vm, expOrFn, handler)

    return function unWatch () {
        watcher.teardown()
    }
}



const data = {
    x: 56,
    y: 78,
    z: 20
}


const vm = {
    data: data,
}

const watch = {
    x (newVal, oldVal) {
        console.log(
            `x change: ${newVal}  from ${oldVal}`
        )
    },

    y (newVal, oldVal) {
        console.log(
            `x change: ${newVal}  from ${oldVal}`
        )
    },

    z (newVal, oldVal) {
        console.log(
            `x change: ${newVal}  from ${oldVal}`
        )
    }
}


observe(data, true)

window.__vm = vm

const unWatch = createWatcher(vm, 'data.x', watch.x)
const unWatch2 = createWatcher(vm, 'data.y', watch.y)


vm.data.x = 99
vm.data.y = 85

