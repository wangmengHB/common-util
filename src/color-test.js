import './color-test.less';
import { colorPalette, colorEasing } from './color';

function createColors(base) {
  return [
    colorPalette(base, 1),
    colorPalette(base, 2),
    colorPalette(base, 3),
    colorPalette(base, 4),
    colorPalette(base, 5),
    // colorPalette(base, 6),
    base,
    colorPalette(base, 7),
    colorPalette(base, 8),
    colorPalette(base, 9),
    colorPalette(base, 10),
  ]
}

function createColorBlock(colors) {
  let container = document.createElement('div');
  container.className = 'color-block';
  for (let i = 0; i < colors.length; i++) {
    let ele = document.createElement('div');
    ele.style.backgroundColor = colors[i];
    ele.className = "color";
    ele.innerText = i + 1; 
    container.appendChild(ele);
  }
  document.body.appendChild(container);
}


const blue = '#1890ff';
const purple = '#722ed1';
const cyan = '#13c2c2';
const green = '#52c41a';
const magenta = '#eb2f96';
const pink = '#eb2f96';
const red = '#f5222d';
const oranage = '#fa8c16';
const yellow = '#fadb14';
const volcano = '#fa541c';
const geekblue = '#2f54eb';
const lime = '#a0d911';
const gold = '#faad14';

const blues = createColors(blue);
const purples = createColors(purple);
const cyans = createColors(cyan);
const greens = createColors(green);
const magentas = createColors(magenta);
const pinks = createColors(pink);
const reds = createColors(red);
const oranages = createColors(oranage);
const yellows = createColors(yellow);
const volcanos = createColors(volcano);
const geekblues = createColors(geekblue);
const limes = createColors(lime);
const golds = createColors(gold);


createColorBlock(blues);
createColorBlock(purples);
createColorBlock(cyans);
createColorBlock(greens);
createColorBlock(magentas);
createColorBlock(pinks);
createColorBlock(reds);
createColorBlock(oranages);
createColorBlock(yellows);
createColorBlock(volcanos);
createColorBlock(geekblues);
createColorBlock(limes);
createColorBlock(golds);