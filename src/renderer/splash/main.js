import './splash.css'
import logoUrl from '../../../resources/img/Crafting_Table.png'
import en from '../src/i18n/locales/en.json'
import fr from '../src/i18n/locales/fr.json'
import { THEMES, renderScene, smooth, fract } from './engine'

const params = new URLSearchParams(location.search)
const messages = params.get('lang') === 'fr' ? fr : en
const gameVersion = params.get('mc') || ''
const loaderVersion = params.get('neoforge') || ''

function translate(key) {
  return key.split('.').reduce((node, part) => node?.[part], messages) ?? key
}

const STAGE_LIMIT = 4
const STAGE_TIME_CONSTANT = 2.5
const DYK_PERIOD = 8
const PIPS = [
  'gui.arffornia.loading.pip.java',
  'gui.arffornia.loading.pip.mods',
  'gui.arffornia.loading.pip.content',
  'gui.arffornia.loading.pip.resources',
  'gui.arffornia.loading.pip.ready'
]
const MACHINES = ['miner', 'smelter', 'constructor', 'foundry', 'assembler', 'elevator']
const DYK = [
  {
    machine: 'miner',
    at: [0.3, 2.5, 2],
    z: 1.3,
    name: 'gui.arffornia.machine.miner',
    text: 'gui.arffornia.loading.dyk.miner'
  },
  {
    machine: 'smelter',
    at: [5.5, 2.5, 2],
    z: 1.2,
    name: 'gui.arffornia.machine.smelter',
    text: 'gui.arffornia.loading.dyk.smelter'
  },
  {
    machine: 'constructor',
    at: [10.5, 2.5, 2],
    z: 1.2,
    name: 'gui.arffornia.machine.constructor',
    text: 'gui.arffornia.loading.dyk.constructor'
  },
  {
    machine: 'foundry',
    at: [11.2, -2.9, 3],
    z: 1.2,
    name: 'gui.arffornia.machine.foundry',
    text: 'gui.arffornia.loading.dyk.foundry'
  },
  {
    machine: 'elevator',
    at: [22.5, 2.0, 3],
    z: 4.0,
    name: 'gui.arffornia.machine.elevator',
    text: 'gui.arffornia.loading.dyk.elevator'
  }
]

// Spec 007 player experience: the factory stays at rest until the early window powers the Miner on,
// so the handoff is where the scene comes alive.
const REST = {
  bt: 0,
  mt: Object.fromEntries(MACHINES.map((m) => [m, 0])),
  pw: Object.fromEntries(MACHINES.map((m) => [m, 0])),
  flash: {},
  launch: 0
}
const CAMERA = {
  cx: 12.6,
  cy: 2.2,
  cz: 2.4,
  scale: 1 / 22,
  fx: 0.53,
  fy: 0.405,
  timeline: () => REST
}
const theme = THEMES.night

const hud = document.getElementById('hud')
hud.innerHTML = `
  <div class="top"><div class="pips"></div></div>
  <div class="bottom">
    <div class="brand"><img alt="" /><div class="stack"><div class="word">ARFFORNIA</div><div class="sub"></div></div></div>
    <div class="status">
      <div class="row"><div class="stage"></div><div class="pct"><span></span><small>%</small></div></div>
      <div class="bar"><i class="fill"></i><i class="head"></i></div>
      <div class="meta"><span class="versions"></span><span class="moj">Mojang Studios</span></div>
    </div>
  </div>
  <div class="dyk"><canvas></canvas><span class="name"></span><div class="txt"><div class="lab"><span class="label"></span><span class="dots"></span></div><p></p></div></div>`

const $ = (selector) => hud.querySelector(selector)
$('.brand img').src = logoUrl
$('.sub').textContent = translate('gui.arffornia.brand.tagline')
$('.stage').textContent = translate('gui.arffornia.loading.stage.boot')
$('.versions').textContent = `Minecraft ${gameVersion} · NeoForge ${loaderVersion}`
$('.dyk .label').textContent = translate('gui.arffornia.loading.dyk.label')
PIPS.forEach((key, i) => {
  if (i) $('.pips').appendChild(Object.assign(document.createElement('i'), { className: 'link' }))
  const pip = document.createElement('div')
  pip.className = i === 0 ? 'pip active' : 'pip'
  pip.innerHTML = '<i class="dia"></i><span></span>'
  pip.querySelector('span').textContent = translate(key)
  $('.pips').appendChild(pip)
})
DYK.forEach(() => {
  const dot = document.createElement('i')
  dot.appendChild(document.createElement('b'))
  $('.dyk .dots').appendChild(dot)
})

const canvas = document.getElementById('scene')
const ctx = canvas.getContext('2d')
const dykCanvas = $('.dyk canvas')
const dykCtx = dykCanvas.getContext('2d')
const dots = [...hud.querySelectorAll('.dyk .dots i')]

function fitToWindow() {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(innerWidth * dpr)
  canvas.height = Math.round(innerHeight * dpr)
  document.documentElement.style.setProperty('--ui', String(innerWidth / 1280))
  return dpr
}
let dpr = fitToWindow()
addEventListener('resize', () => {
  dpr = fitToWindow()
})

function drawHud(t) {
  const pct = STAGE_LIMIT * (1 - Math.exp(-t / STAGE_TIME_CONSTANT))
  $('.pct span').textContent = String(Math.floor(pct))
  $('.bar .fill').style.width = `${pct}%`
  $('.bar .fill').style.backgroundPosition = `${(t * 34) % 34}px 0`
  $('.bar .head').style.left = `${pct}%`
  $('.pip.active').style.setProperty('--pulse', (0.55 + 0.45 * Math.sin(t * 5)).toFixed(3))
}

function drawDidYouKnow(t) {
  const n = Math.floor(t / DYK_PERIOD) % DYK.length
  const k = fract(t / DYK_PERIOD)
  const tip = DYK[n]
  const alpha = smooth(0, 0.07, k) * (1 - smooth(0.94, 1, k))
  const w = 320
  const h = 136
  if (dykCanvas.width !== w * dpr) {
    dykCanvas.width = w * dpr
    dykCanvas.height = h * dpr
  }
  const tall = tip.machine === 'elevator'
  renderScene(dykCtx, w, h, dpr, theme, 20 + t, {
    cx: tip.at[0] + tip.at[2] / 2,
    cy: tip.at[1] + tip.at[2] / 2,
    cz: tip.z,
    scale: (tall ? 1 / 10.5 : 1 / 4.1) * (1 + 0.05 * k),
    fx: 0.5,
    fy: tall ? 0.52 : 0.7,
    silhouettes: false,
    drift: false,
    only: tip.machine
  })
  const cw = dykCanvas.width
  const ch = dykCanvas.height
  // a vignette so the machine reads as a close-up, not a crop of the big scene
  const g = dykCtx.createRadialGradient(cw / 2, ch * 0.55, ch * 0.25, cw / 2, ch * 0.55, cw * 0.62)
  g.addColorStop(0, 'rgba(10,16,20,0)')
  g.addColorStop(1, 'rgba(10,16,20,0.85)')
  dykCtx.setTransform(1, 0, 0, 1, 0, 0)
  dykCtx.fillStyle = g
  dykCtx.fillRect(0, 0, cw, ch)
  dykCtx.fillStyle = `rgba(10,16,20,${(1 - alpha).toFixed(3)})`
  dykCtx.fillRect(0, 0, cw, ch)
  $('.dyk .name').textContent = translate(tip.name)
  const text = $('.dyk p')
  text.textContent = translate(tip.text)
  text.style.opacity = alpha.toFixed(3)
  dots.forEach((dot, i) => {
    dot.classList.toggle('done', i < n)
    dot.classList.toggle('on', i === n)
    dot.querySelector('b').style.width = `${i === n ? k * 100 : 0}%`
  })
  $('.dyk').style.opacity = smooth(0.3, 0.9, t).toFixed(3)
}

function renderFrame(t) {
  renderScene(ctx, innerWidth, innerHeight, dpr, theme, t, CAMERA)
  drawHud(t)
  drawDidYouKnow(t)
}

const startedAt = performance.now()
let frameRequest = 0
function loop(now) {
  renderFrame(Math.max(0, (now - startedAt) / 1000))
  frameRequest = requestAnimationFrame(loop)
}
function setRunning(running) {
  cancelAnimationFrame(frameRequest)
  frameRequest = running ? requestAnimationFrame(loop) : 0
}
document.addEventListener('visibilitychange', () => setRunning(!document.hidden))
document.fonts.ready.then(() => {
  renderFrame(0)
  setRunning(!document.hidden)
})
