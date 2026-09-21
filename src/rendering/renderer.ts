import { PLANT, WORLD } from '../simulation/config.ts';
import type { Garden } from '../simulation/garden.ts';
import { between, createRandom } from '../simulation/random.ts';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly background: HTMLCanvasElement;
  private scale = 1;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('This browser does not support Canvas 2D.');
    this.ctx = ctx;
    this.background = document.createElement('canvas');
    this.background.width = WORLD.width;
    this.resize(canvas.width, canvas.height);
  }

  resize(width: number, height: number): void {
    const pixelHeight = Math.max(1, Math.round(WORLD.width * height / Math.max(1, width)));
    this.ctx.canvas.width = WORLD.width;
    this.ctx.canvas.height = pixelHeight;
    this.ctx.imageSmoothingEnabled = false;
    this.background.height = pixelHeight;
    this.scale = Math.min(1, pixelHeight / WORLD.height);
    this.offsetY = pixelHeight - WORLD.height * this.scale;
    this.paintBackground();
  }

  draw(garden: Garden, cursor: number | null = null): void {
    this.ctx.drawImage(this.background, 0, 0);
    for (const plant of garden.plants) {
      this.ctx.save();
      this.ctx.translate(plant.x, this.offsetY + plant.y * this.scale);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.translate(-PLANT.rootX, -PLANT.rootY);
      this.ctx.beginPath();
      this.ctx.rect(0, 0, PLANT.width, PLANT.height);
      this.ctx.clip();
      plant.draw(this.ctx);
      this.ctx.restore();
    }
    if (cursor !== null) {
      this.ctx.fillStyle = '#b78b5d';
      const ground = this.offsetY + WORLD.ground * this.scale;
      this.ctx.fillRect(Math.round(cursor) - 4, ground + 15 * this.scale, 9, 1);
      this.ctx.fillRect(Math.round(cursor), ground + 12 * this.scale, 1, 7 * this.scale);
    }
  }

  private paintBackground(): void {
    const ctx = this.background.getContext('2d')!;
    const random = createRandom('ground');
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
  }
}
