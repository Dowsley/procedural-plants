import type { FlowerKind } from './config.ts';

export interface Point { x: number; y: number }

export interface Branch extends Point {
  angle: number;
  length: number;
  totalLength: number;
  depth: number;
  dead: boolean;
  points: Point[];
}

export interface Leaf extends Point {
  angle: number;
  side: number;
  size: number;
  width: number;
  growth: number;
  depth: number;
}

export interface Flower extends Point {
  kind: FlowerKind;
  angle: number;
  color: string;
  growth: number;
  life: number;
  points: Point[];
  petals: number;
  size: number;
  alternate: boolean;
}
