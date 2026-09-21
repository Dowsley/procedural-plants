import type { Sketch } from '../rendering/sketch.ts';
import type { Random } from './random.ts';
import type { Entity } from './types.ts';

export class Leaf implements Entity {
  x: number;
  y: number;
  angle: number;
  color: string;
  side: number;
  size: number;
  growth = 0;
  roundness: number;

  constructor(x: number, y: number, angle: number, color: string, random: Random = Math.random) {
    this.x = x;
    this.y = y;
    this.angle = angle + (random() - 0.5) * Math.PI / 2;
    this.color = color;
    this.side = random() < 0.5 ? -1 : 1;
    this.size = random() * 0.2 + 1;
    this.roundness = Math.ceil(random() * 2 + 1);
  }

  update(sketch: Sketch): Entity[] {
    this.growth = sketch.lerp(this.growth, 1, 0.1);
    return [];
  }

  draw(sketch: Sketch): void {
    const scaledSize = this.size * this.growth;
    for (let layer = 0; layer < 5; layer++) {
      sketch.push();
      sketch.translate(this.x, this.y - 1);
      sketch.rotate(this.angle);
      sketch.fill(sketch.lerpColor(sketch.color(this.color), sketch.color('white'), 0.3));
      sketch.noStroke();
      sketch.noSmooth();
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, 0, Math.PI);
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, Math.PI, 0);
      sketch.pop();

      sketch.push();
      sketch.translate(this.x, this.y);
      sketch.rotate(this.angle);
      sketch.fill(this.color);
      sketch.noStroke();
      sketch.noSmooth();
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, 0, Math.PI);
      sketch.arc(0, 4 * this.side * this.growth, this.roundness * scaledSize, 6 * scaledSize, Math.PI, 0);
      sketch.pop();
    }
  }
}
