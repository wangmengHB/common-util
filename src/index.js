// test case
import {noop} from './util'
import {defineReactive, observe, Watcher} from './observer'

import { colorPalette, colorEasing } from './color';


const blue = '#1890ff';



const color1 = colorPalette(blue, 1);
const color2 = colorPalette(blue, 2);
const color3 = colorPalette(blue, 3);
const color4 = colorPalette(blue, 4);
const color5 = colorPalette(blue, 5);
const color6 = blue;
const color7 = colorPalette(blue, 7);
const color8 = colorPalette(blue, 8);
const color9 = colorPalette(blue, 9);
const color10 = colorPalette(blue, 10);


const colors = [
  color1,
  color2,
  color3,
  color4,
  color5,
  color6,
  color7,
  color8,
  color9,
  color10,
];

function createColorBlock(colors) {
  for (let i = 0; i < colors.length; i++) {
    let ele = document.createElement('div');
    ele.style.backgroundColor = colors[i];
    ele.style.width = '50px';
    ele.style.height = '20px';
    ele.style.margin = '5px';
    document.body.appendChild(ele);
  }
}

createColorBlock(colors);






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

