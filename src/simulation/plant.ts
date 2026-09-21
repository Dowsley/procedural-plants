import { Sketch } from '../rendering/sketch.ts';
import { Branch } from './branch.ts';
import { Flower } from './flower.ts';
import { Leaf } from './leaf.ts';
import { PLANT } from './config.ts';
import type { Random } from './random.ts';
import type { Entity } from './types.ts';

/** Places a 160 by 240 plant simulation in the garden without changing its coordinates. */
export class Plant {
  readonly x: number;
  readonly y: number;
  readonly sketch: Sketch;
  readonly entities: Entity[];

  constructor(x: number, y: number, palette: readonly string[], random: Random = Math.random) {
    this.x = x;
    this.y = y;
    this.entities = [new Branch(PLANT.rootX, PLANT.rootY, -Math.PI / 2, '#286428ff', 0)];
    this.sketch = new Sketch(PLANT.width, PLANT.height, palette, random);
  }

  advanceFrame(): boolean {
    const interval = Math.min(Math.floor(this.sketch.frameCount / 75) + 1, 6);
    const update = this.sketch.frameCount % interval === 0;
    if (update) {
      /* Appended entities also update during this pass. */
      for (const entity of this.entities) this.entities.push(...entity.update(this.sketch));
    }
    this.sketch.frameCount++;
    return update;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.sketch.ctx = ctx;
    for (const entity of this.entities) entity.draw(this.sketch);
  }

  /** Used only to present a still image for reduced-motion preferences. */
  get mature(): boolean {
    return this.entities.every(entity => {
      if (entity instanceof Branch) return entity.dead;
      if (entity instanceof Flower) return entity.life <= 0 && entity.growth > 0.999;
      if (entity instanceof Leaf) return entity.growth > 0.999;
      return true;
    });
  }
}
