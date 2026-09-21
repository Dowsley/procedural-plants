export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toString(): string {
    return `rgba(${Math.round(this.r)},
    ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a / 255})`;
  }
}
