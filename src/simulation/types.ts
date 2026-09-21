import type { Sketch } from '../rendering/sketch.ts';

export interface Point { x: number; y: number }

export interface Entity {
  update(sketch: Sketch): Entity[];
  draw(sketch: Sketch): void;
}
