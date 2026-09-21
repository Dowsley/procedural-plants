import { Color } from './color.ts';
import { createNoise } from '../simulation/noise.ts';
import type { Random } from '../simulation/random.ts';

type ColorInput = Color | string | number;
type ColorMode = 'rgb' | 'hsb';

/** Drawing primitives and color conversion used by the plant entities. */
export class Sketch {
  ctx!: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly random: Random;
  readonly flowerColors: readonly string[];
  readonly noise: (x: number, y: number) => number;
  readonly HSB = 'hsb';
  readonly RGB = 'rgb';
  readonly CLOSE = 'close';
  frameCount = 0;
  private mode: ColorMode = 'rgb';

  constructor(width: number, height: number, flowerColors: readonly string[], random: Random = Math.random) {
    this.width = width;
    this.height = height;
    this.flowerColors = flowerColors;
    this.random = random;
    this.noise = createNoise(random);
  }

  lerp(start: number, end: number, amount: number): number {
    return amount * (end - start) + start;
  }

  colorMode(mode: ColorMode): void { this.mode = mode; }

  color(r: ColorInput, g?: number, b?: number, a?: number): Color {
    if (r instanceof Color) return new Color(r.r, r.g, r.b, r.a);
    if (typeof r === 'string') {
      const colorStr = r.trim();
      if (colorStr === 'white') return new Color(255, 255, 255);
      if (colorStr === 'black') return new Color(0, 0, 0);
      if (colorStr === 'transparent') return new Color(0, 0, 0, 0);
      if (colorStr.startsWith('#')) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length === 6) hex += 'ff';
        const value = parseInt(hex, 16);
        return new Color((value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255);
      }
      if (colorStr.startsWith('rgb')) {
        const values = colorStr.match(/[\d.]+/g);
        if (values && values.length >= 3) {
          return new Color(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), values[3] ? parseFloat(values[3]) * 255 : 255);
        }
      }
      return new Color(0, 0, 0);
    }
    if (typeof r === 'number' && g !== undefined && b !== undefined) {
      const alpha = a !== undefined ? a : (this.mode === this.RGB ? 255 : 1);
      return this.mode === this.HSB ? this.hsbToRgb(r, g, b, alpha) : new Color(r, g, b, alpha);
    }
    return new Color(0, 0, 0);
  }

  lerpColor(first: Color, second: Color, amount: number): Color {
    return new Color(this.lerp(first.r, second.r, amount), this.lerp(first.g, second.g, amount),
      this.lerp(first.b, second.b, amount), this.lerp(first.a, second.a, amount));
  }

  rgbToHsb(r: number, g: number, b: number): { h: number; s: number; b: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, b: v * 100 };
  }

  hsbToRgb(h: number, s: number, b: number, a: number): Color {
    s /= 100;
    b /= 100;
    const f = (n: number) => (n + h / 60) % 6;
    const convert = (n: number) => b * (1 - s * Math.max(0, Math.min(f(n), 4 - f(n), 1)));
    return new Color(convert(5) * 255, convert(3) * 255, convert(1) * 255, a * 255);
  }

  hue(color: Color): number { return this.rgbToHsb(color.r, color.g, color.b).h; }
  saturation(color: Color): number { return this.rgbToHsb(color.r, color.g, color.b).s; }
  brightness(color: Color): number { return this.rgbToHsb(color.r, color.g, color.b).b; }
  push(): void { this.ctx.save(); }
  pop(): void { this.ctx.restore(); }
  translate(x: number, y: number): void { this.ctx.translate(x, y); }
  rotate(angle: number): void { this.ctx.rotate(angle); }
  stroke(color: ColorInput): void { this.ctx.strokeStyle = this.color(color).toString(); }
  strokeWeight(weight: number): void { this.ctx.lineWidth = weight; }
  noStroke(): void { this.ctx.strokeStyle = 'rgba(0,0,0,0)'; }
  fill(color: ColorInput): void { this.ctx.fillStyle = this.color(color).toString(); }
  noFill(): void { this.ctx.fillStyle = 'rgba(0,0,0,0)'; }
  noSmooth(): void { this.ctx.imageSmoothingEnabled = false; }
  beginShape(): void { this.ctx.beginPath(); }
  vertex(x: number, y: number): void { this.ctx.lineTo(x, y); }

  endShape(mode?: string): void {
    if (mode === 'close') this.ctx.closePath();
    if (this.ctx.fillStyle && !this.ctx.fillStyle.toString().includes(', 0)')) this.ctx.fill();
    if (this.ctx.strokeStyle && !this.ctx.strokeStyle.toString().includes(', 0)')) this.ctx.stroke();
  }

  rect(x: number, y: number, w: number, h: number): void {
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.endShape();
  }

  ellipse(x: number, y: number, w: number, h: number): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    this.endShape();
  }

  arc(x: number, y: number, w: number, h: number, start: number, end: number): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w / 2, h / 2, 0, start, end);
    this.ctx.lineTo(x, y);
    this.endShape();
  }
}
