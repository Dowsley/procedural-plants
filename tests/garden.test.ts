import assert from 'node:assert/strict';
import { test } from 'bun:test';
import { Garden } from '../src/simulation/garden.ts';
import { GROWTH, VARIETIES, WORLD } from '../src/simulation/config.ts';
import type { Variety } from '../src/simulation/config.ts';
import { Plant } from '../src/simulation/plant.ts';

function advance(garden: Garden, ticks = 400): void {
  for (let tick = 0; tick < ticks; tick++) garden.update();
}

function snapshot(garden: Garden): string {
  return JSON.stringify(garden.plants);
}

test('replaying a seed reproduces layout, growth paths, foliage, and flowers', () => {
  const first = new Garden('wildflower');
  const replay = new Garden('wildflower');
  const different = new Garden('another-meadow');
  advance(first);
  advance(replay);
  advance(different);
  assert.equal(snapshot(first), snapshot(replay));
  assert.notEqual(snapshot(first), snapshot(different));
  assert.ok(first.blooms > 0);
});

test('adding a plant does not change existing plants', () => {
  const untouched = new Garden('neighbors');
  const planted = new Garden('neighbors');
  advance(untouched, 50);
  advance(planted, 50);
  planted.addPlant(200, 'bluebell');
  advance(untouched);
  advance(planted);
  assert.equal(JSON.stringify(untouched.plants), JSON.stringify(planted.plants.slice(0, WORLD.initialPlants)));
});

test('growth finishes, stays within bounds, and stops mutating when settled', () => {
  for (const seed of ['wildflower', 'garden', '12345', 'sun', 'rain', 'lavender']) {
    const garden = new Garden(seed);
    advance(garden, 500);
    assert.ok(garden.settled, `${seed} did not settle`);
    for (const plant of garden.plants) {
      assert.ok(plant.branches.length <= 2 ** (GROWTH.maxSplits + 1) - 1);
      for (const branch of plant.branches) {
        assert.ok(branch.depth <= GROWTH.maxSplits);
        for (const point of branch.points) {
          assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
          assert.ok(point.x >= 0 && point.x <= WORLD.width);
          assert.ok(point.y >= 0 && point.y <= plant.y);
        }
      }
      for (const flower of plant.flowers) {
        assert.ok(flower.points.length <= GROWTH.maxClusterPoints);
        for (let i = 0; i < flower.points.length; i++) {
          for (let j = i + 1; j < flower.points.length; j++) {
            assert.ok(Math.hypot(flower.points[i].x - flower.points[j].x, flower.points[i].y - flower.points[j].y) >= 3);
          }
        }
      }
    }
    const settled = snapshot(garden);
    advance(garden, 20);
    assert.equal(snapshot(garden), settled);
  }
});

test('planting clamps roots, rejects invalid positions, and enforces capacity', () => {
  const garden = new Garden('capacity');
  assert.equal(garden.addPlant(Number.NaN, 'mixed'), false);
  assert.equal(garden.addPlant(Number.POSITIVE_INFINITY, 'mixed'), false);
  garden.addPlant(-100, 'mixed');
  assert.equal(garden.plants.at(-1)?.x, 20);
  garden.addPlant(1000, 'mixed');
  assert.equal(garden.plants.at(-1)?.x, WORLD.width - 20);
  while (garden.plants.length < WORLD.maxPlants) {
    assert.equal(garden.addPlant(garden.findOpenSpot(), 'cosmos'), true);
  }
  assert.equal(garden.addPlant(200, 'cosmos'), false);
  assert.equal(garden.plants.length, WORLD.maxPlants);
});

test('a selected variety only produces its configured flower shapes and colors', () => {
  for (const variety of Object.keys(VARIETIES) as Variety[]) {
    const plant = new Plant('variety-test', 200, WORLD.ground, variety);
    for (let tick = 0; tick < 400; tick++) plant.update();
    assert.ok(plant.flowers.length > 0);
    for (const flower of plant.flowers) {
      assert.ok(VARIETIES[variety].flowers.includes(flower.kind));
      assert.ok(VARIETIES[variety].colors.includes(flower.color));
    }
  }
});

test('a garden can grow again after a seed is added to a settled scene', () => {
  const garden = new Garden('second-growth');
  advance(garden);
  assert.equal(garden.settled, true);
  garden.addPlant(garden.findOpenSpot(), 'marigold');
  assert.equal(garden.settled, false);
  advance(garden);
  assert.equal(garden.settled, true);
  assert.ok(garden.plants.at(-1)!.flowers.length > 0);
});
