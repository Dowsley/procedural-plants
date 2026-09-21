import { WORLD } from '../simulation/config.ts';
import type { Garden } from '../simulation/garden.ts';
import type { Plant } from '../simulation/plant.ts';
import type { Flower, Leaf, Point } from '../simulation/types.ts';
import { between, createRandom } from '../simulation/random.ts';

function tint(hex: string, amount: number): string {
  const color = Number.parseInt(hex.slice(1), 16);
  const blend = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${blend(color >> 16)}, ${blend((color >> 8) & 255)}, ${blend(color & 255)})`;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly background: HTMLCanvasElement;
  private backgroundSeed = '';
  private scale = 1;
  private offsetY = 0;

  resize(width: number, height: number): void {
    const pixelHeight = Math.max(1, Math.round(WORLD.width * height / Math.max(1, width)));
    this.ctx.canvas.width = WORLD.width;
    this.ctx.canvas.height = pixelHeight;
    this.ctx.imageSmoothingEnabled = false;
    this.background.height = pixelHeight;
    this.scale = Math.min(1, pixelHeight / WORLD.height);
    this.offsetY = pixelHeight - WORLD.height * this.scale;
    this.backgroundSeed = '';
  }

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('This browser does not support Canvas 2D.');
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;
    this.background = document.createElement('canvas');
    this.background.width = WORLD.width;
    this.background.height = WORLD.height;
  }

  draw(garden: Garden, cursor: number | null = null): void {
    if (this.backgroundSeed !== garden.seed) this.paintBackground(garden.seed);
    this.ctx.drawImage(this.background, 0, 0);
    const plants = [...garden.plants].sort((a, b) => a.y - b.y);
    for (const plant of plants) {
      this.ctx.save();
      this.ctx.translate(plant.x, this.offsetY);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.translate(-plant.x, 0);
      this.drawPlant(plant);
      this.ctx.restore();
    }
    if (cursor !== null) {
      this.ctx.fillStyle = '#b78b5d';
      const ground = this.offsetY + WORLD.ground * this.scale;
      this.ctx.fillRect(Math.round(cursor) - 4, ground + 15 * this.scale, 9, 1);
      this.ctx.fillRect(Math.round(cursor), ground + 12 * this.scale, 1, 7 * this.scale);
    }
  }

  private paintBackground(seed: string): void {
    const ctx = this.background.getContext('2d')!;
    const random = createRandom(`${seed}:scenery`);
    const ground = this.offsetY + WORLD.ground * this.scale;
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, WORLD.width, this.background.height);
    ctx.fillStyle = '#f0efdf';
    ctx.fillRect(0, ground + 3 * this.scale, WORLD.width, this.background.height - ground);
    for (let i = 0; i < 420; i++) {
      const x = Math.floor(random() * WORLD.width);
      const y = Math.floor(between(random, ground - this.scale, this.background.height));
      ctx.fillStyle = i % 4 === 0 ? '#d8ddc3' : '#e5e5d1';
      ctx.fillRect(x, y, random() < 0.7 ? 1 : 2, 1);
    }
    for (let i = 0; i < 130; i++) {
      const x = Math.floor(random() * WORLD.width);
      const y = Math.floor(between(random, ground - 2 * this.scale, ground + 12 * this.scale));
      ctx.fillStyle = i % 3 === 0 ? '#9bab79' : '#b7c297';
      ctx.fillRect(x, y - 2, 1, 3);
      if (i % 2 === 0) ctx.fillRect(x - 1, y - 1, 3, 1);
    }
    this.backgroundSeed = seed;
  }

  private drawPlant(plant: Plant): void {
    for (const branch of plant.branches) {
      this.ctx.fillStyle = tint(plant.green, branch.depth * 0.055);
      const width = branch.depth < 2 ? 2 : 1;
      for (const point of branch.points) this.ctx.fillRect(Math.floor(point.x), Math.floor(point.y), width, width);
    }
    for (const leaf of plant.leaves) this.drawLeaf(leaf, plant.green);
    for (const flower of plant.flowers) this.drawFlower(flower);
  }

  private drawLeaf(leaf: Leaf, color: string): void {
    const size = leaf.size * leaf.growth;
    const angle = leaf.angle + leaf.side * 0.8;
    const x = leaf.x + Math.cos(angle) * size * 3;
    const y = leaf.y + Math.sin(angle) * size * 3;
    this.ellipse(x, y - 1, size * 3.4, leaf.width * size / 2, angle, tint(color, 0.3));
    this.ellipse(x, y, size * 3.4, leaf.width * size / 2, angle, tint(color, leaf.depth * 0.025));
  }

  /** Scan conversion keeps curved shapes on the same pixel grid as stems. */
  private ellipse(x: number, y: number, rx: number, ry: number, angle: number, color: string): void {
    if (rx < 0.1 || ry < 0.1) return;
    this.ctx.fillStyle = color;
    const radius = Math.ceil(Math.max(rx, ry));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        if ((localX / rx) ** 2 + (localY / ry) ** 2 <= 1) {
          this.ctx.fillRect(Math.round(x) + dx, Math.round(y) + dy, 1, 1);
        }
      }
    }
  }

  private drawFlower(flower: Flower): void {
    for (const point of flower.points) {
      const size = flower.size * flower.growth;
      const { x, y } = point;
      switch (flower.kind) {
        case 'cross':
          this.ctx.fillStyle = flower.color;
          this.ctx.fillRect(x - 1, y - size, 3, size * 2 + 1);
          this.ctx.fillRect(x - size, y - 1, size * 2 + 1, 3);
          this.ctx.fillStyle = '#fff5d5';
          this.ctx.fillRect(x, y, 1, 1);
          break;
        case 'simple':
          this.ctx.fillStyle = flower.color;
          this.ctx.fillRect(x - 1, y - 1, 3, 3);
          this.ctx.fillStyle = '#fff5d5';
          this.ctx.fillRect(x, y, 1, 1);
          break;
        case 'square':
          this.ctx.fillStyle = flower.color;
          this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
          this.ctx.fillStyle = tint(flower.color, 0.35);
          this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
          break;
        case 'cluster':
          this.ellipse(x, y, size * 0.8, size * 0.8, 0, flower.color);
          this.ctx.fillStyle = tint(flower.color, 0.5);
          this.ctx.fillRect(x, y - 1, 1, 1);
          break;
        case 'radial':
          for (let petal = 0; petal < flower.petals; petal++) {
            const angle = petal / flower.petals * Math.PI * 2 + flower.angle;
            const color = flower.alternate && petal % 2 === 0 ? tint(flower.color, 0.25) : flower.color;
            this.ellipse(x + Math.cos(angle) * size, y + Math.sin(angle) * size, size * 0.75, size * 0.65, angle, color);
          }
          this.ellipse(x, y, size * 0.55, size * 0.55, 0, '#eee1ad');
          break;
        case 'bell':
          this.drawBell(point, flower, size);
          break;
      }
    }
  }

  private drawBell(point: Point, flower: Flower, size: number): void {
    const angle = flower.angle + Math.sin(Math.PI / 2 - flower.angle) * 0.5;
    const length = size * 3;
    for (let step = 0; step < length; step++) {
      const progress = step / length;
      const x = point.x + Math.cos(angle) * step;
      const y = point.y + Math.sin(angle) * step;
      this.ellipse(x, y, 0.8 + progress * size * 0.8, 1, angle + Math.PI / 2, flower.color);
    }
    this.ellipse(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length,
      size * 0.85, 1, angle + Math.PI / 2, tint(flower.color, 0.4));
  }
}
