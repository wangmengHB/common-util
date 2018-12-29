// test case
import './color-test';
import {noop} from './util'
import {defineReactive, observe, Watcher} from './observer';













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

function render() {
  console.log(
        `
        render function:
        x: ${vm.data.x}
        y: ${vm.data.y}
        z: ${vm.data.z}
        `
    )
}


observe(data, true)

window.__vm = vm

const unWatch = createWatcher(vm, 'data.x', watch.x)
const unWatch2 = createWatcher(vm, 'data.y', watch.y)
const unWatch3 = createWatcher(vm, render, noop, null, true)



vm.data.x = 99
vm.data.y = 85

