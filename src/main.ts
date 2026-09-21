import './styles.css';
import { WORLD } from './simulation/config.ts';
import { Garden } from './simulation/garden.ts';
import { Renderer } from './rendering/renderer.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#garden');
if (!canvas) throw new Error('Missing garden canvas.');

const garden = new Garden();
const renderer = new Renderer(canvas);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const step = 1000 / 60;
let cursor: number | null = null;
let lastTime = 0;
let dirty = true;
let frameId = 0;

const resizeObserver = new ResizeObserver(([entry]) => {
  renderer.resize(entry.contentRect.width, entry.contentRect.height);
  dirty = true;
});
resizeObserver.observe(canvas);

function settle(): void {
  while (!garden.mature) garden.advanceFrame();
  dirty = true;
}

function plant(x: number): void {
  if (!garden.addPlant(x)) return;
  if (motionPreference.matches) settle();
  dirty = true;
  canvas!.setAttribute('aria-disabled', String(garden.plants.length >= WORLD.maxPlants));
}

canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const bounds = canvas.getBoundingClientRect();
  cursor = null;
  plant((event.clientX - bounds.left) / bounds.width * WORLD.width);
});
canvas.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    cursor = Math.max(20, Math.min(WORLD.width - 20, (cursor ?? garden.findOpenSpot()) + (event.key === 'ArrowLeft' ? -12 : 12)));
    dirty = true;
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    plant(cursor ?? garden.findOpenSpot());
  }
});
canvas.addEventListener('focus', () => {
  if (canvas.matches(':focus-visible')) cursor = garden.findOpenSpot();
  dirty = true;
});
canvas.addEventListener('blur', () => { cursor = null; dirty = true; });
document.addEventListener('visibilitychange', () => { lastTime = 0; });
motionPreference.addEventListener('change', event => { if (event.matches) settle(); });

/** The reference advances at most one 60 Hz frame per animation callback. */
function frame(time: number): void {
  if (!lastTime) lastTime = time;
  const elapsed = time - lastTime;
  if (!document.hidden && !motionPreference.matches && elapsed > step) {
    lastTime = time - (elapsed % step);
    dirty = garden.advanceFrame() || dirty;
  }
  if (dirty) {
    renderer.draw(garden, cursor);
    dirty = false;
  }
  frameId = requestAnimationFrame(frame);
}

if (motionPreference.matches) settle();
frameId = requestAnimationFrame(frame);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(frameId);
  resizeObserver.disconnect();
});
