import { WORLD } from './config.ts';
import type { Variety } from './config.ts';
import { Plant } from './plant.ts';
import { between, createRandom } from './random.ts';

export class Garden {
  readonly seed: string;
  readonly plants: Plant[] = [];

  constructor(seed: string) {
    this.seed = seed.trim() || 'little-garden';
    const random = createRandom(`${this.seed}:layout`);
    for (let i = 0; i < WORLD.initialPlants; i++) {
      const x = 48 + i * 68 + between(random, -12, 12);
      this.addPlant(x, 'mixed', Math.floor(between(random, 0, 36)));
    }
  }

  addPlant(x: number, variety: Variety, delay = 0): boolean {
    if (this.plants.length >= WORLD.maxPlants || !Number.isFinite(x)) return false;
    const random = createRandom(`${this.seed}:root:${this.plants.length}`);
    this.plants.push(new Plant(`${this.seed}:plant:${this.plants.length}`, Math.max(20, Math.min(WORLD.width - 20, x)),
      WORLD.ground + between(random, -4, 8), variety, delay));
    return true;
  }

  /** Keyboard planting fills the largest available gap between roots. */
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

  update(): void {
    for (const plant of this.plants) plant.update();
  }

  get settled(): boolean { return this.plants.every(plant => plant.settled); }
  get blooms(): number { return this.plants.reduce((sum, plant) => sum + plant.flowers.reduce((total, flower) => total + flower.points.length, 0), 0); }
}
