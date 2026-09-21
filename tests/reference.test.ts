import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { Branch } from '../src/simulation/branch.ts';
import { Flower } from '../src/simulation/flower.ts';
import { Leaf } from '../src/simulation/leaf.ts';
import { Plant } from '../src/simulation/plant.ts';
import { Garden } from '../src/simulation/garden.ts';
import { createPalette, WORLD } from '../src/simulation/config.ts';
import { createRandom } from '../src/simulation/random.ts';
import { Sketch } from '../src/rendering/sketch.ts';
import type { Entity } from '../src/simulation/types.ts';

const source = readFileSync(new URL('../reference/plants.js', import.meta.url), 'utf8');

function drawingContext() {
  const calls: unknown[][] = [];
  let state: Record<string, unknown> = { fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1, imageSmoothingEnabled: true };
  const stack: Record<string, unknown>[] = [];
  const ctx = new Proxy({}, {
    get(_target, key: string) {
      if (key in state) return state[key];
      return (...args: unknown[]) => {
        calls.push([key, ...args]);
        if (key === 'save') stack.push({ ...state });
        if (key === 'restore') state = stack.pop()!;
      };
    },
    set(_target, key: string, value: unknown) {
      calls.push(['set', key, value]);
      state[key] = value;
      return true;
    },
  }) as CanvasRenderingContext2D;
  return { ctx, calls };
}

interface Reference {
  Sketch: new (canvas: unknown) => Sketch;
  Branch: typeof Branch;
  Leaf: typeof Leaf;
  Flower: typeof Flower;
  FLOWER_COLORS: string[];
}

function reference(seed: string) {
  const random = createRandom(seed);
  const math = Object.create(Math) as Math;
  math.random = random;
  const context = createContext({ Math: math, window: { addEventListener() {} }, requestAnimationFrame() {} });
  const exports = runInContext(`${source}\n;({ Sketch, Branch, Leaf, Flower, FLOWER_COLORS });`, context) as Reference;
  const drawing = drawingContext();
  const sketch = new exports.Sketch({ width: 160, height: 240, getContext: () => drawing.ctx });
  return { ...exports, sketch, drawing };
}

function plain(value: unknown): unknown { return JSON.parse(JSON.stringify(value)); }

for (const seed of ['wildflower', 'boundary', 'flowers', 'branching']) {
  test(`matches reference growth, random consumption, timing, and drawing: ${seed}`, () => {
    const ref = reference(seed);
    const random = createRandom(seed);
    const palette = createPalette(random);
    expect(palette).toEqual(Array.from(ref.FLOWER_COLORS));
    const plant = new Plant(120, 240, palette, random);
    const entities: Entity[] = [new ref.Branch(120, 240, -Math.PI / 2, '#286428ff', 0)];
    const drawing = drawingContext();
    const checkpoints = new Set([0, 74, 75, 149, 150, 299, 449, 899, 1199]);
    for (let frame = 0; frame < 1200; frame++) {
      const interval = Math.min(Math.floor(frame / 75) + 1, 6);
      const updated = frame % interval === 0;
      if (updated) {
        for (const entity of entities) entities.push(...entity.update(ref.sketch));
      }
      expect(plant.advanceFrame()).toBe(updated);
      ref.sketch.frameCount++;
      if (checkpoints.has(frame)) {
        expect(plain(plant.entities)).toEqual(plain(entities));
        plant.draw(drawing.ctx);
        for (const entity of entities) entity.draw(ref.sketch);
        expect(drawing.calls).toEqual(ref.drawing.calls);
        drawing.calls.length = 0;
        ref.drawing.calls.length = 0;
      }
    }
  });
}

for (let flowerType = 0; flowerType < 6; flowerType++) {
  test(`matches reference flower type ${flowerType} through cluster growth and drawing`, () => {
    const seed = `flower-${flowerType}`;
    const ref = reference(seed);
    const random = createRandom(seed);
    const sketch = new Sketch(160, 240, createPalette(random), random);
    const flower = new Flower(45.4, 60.7, -1.7, '#ff6450ff', random);
    const expected = new ref.Flower(45.4, 60.7, -1.7, '#ff6450ff');
    /* Configure every drawing path even when the random constructor chooses another type. */
    for (const value of [flower, expected]) {
      value.flowerType = flowerType;
      value.life = flowerType === 1 || flowerType === 5 ? 0 : 10;
      value.size = flowerType >= 4 ? 3 : 2;
    }
    const drawing = drawingContext();
    sketch.ctx = drawing.ctx;
    for (let frame = 0; frame < 48; frame++) {
      sketch.frameCount = ref.sketch.frameCount = frame;
      flower.update(sketch);
      expected.update(ref.sketch);
      expect(plain(flower)).toEqual(plain(expected));
      flower.draw(sketch);
      expected.draw(ref.sketch);
      expect(drawing.calls).toEqual(ref.drawing.calls);
      drawing.calls.length = 0;
      ref.drawing.calls.length = 0;
    }
  });
}

test('noise agrees exactly with the reference at positive and negative coordinates', () => {
  const ref = reference('noise');
  const random = createRandom('noise');
  const sketch = new Sketch(160, 240, createPalette(random), random);
  for (const x of [-103.7, -1, 0, 0.001, 7.91, 12, 62.12]) {
    for (const y of [-55.6, 0, 1.01, 24, 110.9]) expect(sketch.noise(x, y)).toBe(ref.sketch.noise(x, y));
  }
});

test('garden placement does not change local plant coordinates or its starting direction', () => {
  const garden = new Garden(createRandom('garden'));
  expect(garden.plants).toHaveLength(WORLD.initialPlants);
  expect(garden.addPlant(Number.NaN)).toBe(false);
  expect(garden.addPlant(320)).toBe(true);
  const plant = garden.plants.at(-1)!;
  expect(plant.x).toBe(320);
  expect(plant.y).toBe(WORLD.ground);
  expect(plain(plant.entities[0])).toEqual(plain(new Branch(120, 240, -Math.PI / 2, '#286428ff', 0)));
  while (garden.plants.length < WORLD.maxPlants) garden.addPlant(garden.findOpenSpot());
  expect(garden.addPlant(100)).toBe(false);
});
