import { createPalette, WORLD } from './config.ts';
import { Plant } from './plant.ts';
import type { Random } from './random.ts';

export class Garden {
  readonly plants: Plant[] = [];
  readonly palette: readonly string[];
  private readonly random: Random;

  constructor(random: Random = Math.random) {
    this.random = random;
    this.palette = createPalette(random);
    for (let i = 0; i < WORLD.initialPlants; i++) this.addPlant(48 + i * 68);
  }

  addPlant(x: number): boolean {
    if (this.plants.length >= WORLD.maxPlants || !Number.isFinite(x)) return false;
    this.plants.push(new Plant(Math.max(20, Math.min(WORLD.width - 20, x)), WORLD.ground, this.palette, this.random));
    return true;
  }

  findOpenSpot(): number {
    const positions = [20, ...this.plants.map(plant => plant.x).sort((a, b) => a - b), WORLD.width - 20];
    let gap = 0;
    let spot = WORLD.width / 2;
    for (let i = 1; i < positions.length; i++) {
      const width = positions[i] - positions[i - 1];
      if (width > gap) {
        gap = width;
        spot = (positions[i] + positions[i - 1]) / 2;
      }
    }
    return spot;
  }

  advanceFrame(): boolean {
    let updated = false;
    for (const plant of this.plants) updated = plant.advanceFrame() || updated;
    return updated;
  }

  get mature(): boolean { return this.plants.every(plant => plant.mature); }
}
