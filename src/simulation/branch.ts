import type { Sketch } from '../rendering/sketch.ts';
import { GRAVITY, MAX_BRANCH_LENGTH } from './config.ts';
import { Leaf } from './leaf.ts';
import { Flower } from './flower.ts';
import type { Entity, Point } from './types.ts';

export class Branch implements Entity {
  x: number;
  y: number;
  angle: number;
  color: string;
  length: number;
  totalLength: number;
  dead = false;
  splitChance = 0.04;
  splitCount: number;
  points: Point[] = [];

  constructor(x: number, y: number, angle: number, color: string, length: number, totalLength = 0, splitCount = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.totalLength = totalLength;
    this.splitCount = splitCount;
    this.color = color;
  }

  update(sketch: Sketch): Entity[] {
    if (this.dead) return [];
    const newEntities: Entity[] = [];
    this.length += 1;
    this.totalLength += 1;
    const noiseAngle = (sketch.noise(this.x * 0.1, this.y * 0.1) - 0.5) * Math.PI / 16;
    this.angle += noiseAngle;

    const boundaryMargin = 32;
    const boundaryForce = 0.1;
    if (this.totalLength > boundaryMargin) {
      if (this.x < boundaryMargin) {
        this.angle += (Math.sin(this.angle) > 0 ? -1 : 1) * boundaryForce;
      } else if (this.x > sketch.width - boundaryMargin) {
        this.angle += (Math.sin(this.angle) > 0 ? 1 : -1) * boundaryForce;
      }
      if (this.y < boundaryMargin) {
        this.angle += (Math.cos(this.angle) > 0 ? 1 : -1) * boundaryForce;
      } else if (this.y > sketch.height - boundaryMargin) {
        this.angle += (Math.cos(this.angle) > 0 ? -1 : 1) * boundaryForce;
      }
    }

    if (this.totalLength > 32) {
      const normalizedAngle = this.angle % (Math.PI * 2);
      let gravityDirection = normalizedAngle > 3 * Math.PI / 2 ? 1 : -1;
      if (normalizedAngle > Math.PI) gravityDirection = 0;
      if (GRAVITY < 0) gravityDirection = -gravityDirection;
      this.angle += GRAVITY * gravityDirection;
    }

    this.x += Math.cos(this.angle);
    this.y += Math.sin(this.angle);
    this.points.push({ x: this.x, y: this.y });

    if (sketch.random() < this.splitChance && this.length > 16 && this.totalLength > 32 && this.splitCount < 4) {
      const splitAngle = sketch.noise(this.x * 0.2 + 100, this.y * 0.2 + 100) * Math.PI / 4 + Math.PI / 8;
      const lighterColor = sketch.lerpColor(sketch.color(this.color), sketch.color('white'), 0.1).toString();
      newEntities.push(new Branch(this.x, this.y, this.angle + splitAngle, lighterColor, 0,
        this.totalLength + Math.floor((sketch.random() - 0.5) * 10), this.splitCount + 1));
      newEntities.push(new Branch(this.x, this.y, this.angle - splitAngle, lighterColor, 0,
        this.totalLength + Math.floor((sketch.random() - 0.5) * 10), this.splitCount + 1));
      this.dead = true;
    }

    if (sketch.random() < 0.03 * Math.ceil(this.totalLength / 64) && this.totalLength > 25) {
      newEntities.push(new Leaf(this.x, this.y, this.angle, this.color, sketch.random));
    }
    const randomFlowerColor = sketch.flowerColors[Math.floor(sketch.random() * sketch.flowerColors.length)];
    if (sketch.random() < 0.01 && this.totalLength > 35) {
      newEntities.push(new Flower(this.x, this.y, this.angle, randomFlowerColor, sketch.random));
    }
    if (this.totalLength > MAX_BRANCH_LENGTH) {
      if (sketch.random() < 0.5) newEntities.push(new Flower(this.x, this.y, this.angle, randomFlowerColor, sketch.random));
      this.dead = true;
    }
    return newEntities;
  }

  draw(sketch: Sketch): void {
    sketch.stroke(this.color);
    sketch.strokeWeight(1);
    sketch.noStroke();
    sketch.fill(this.color);
    sketch.noSmooth();
    for (const point of this.points) sketch.rect(Math.floor(point.x) - 1, Math.floor(point.y) - 1, 2, 2);
    /* A garden may draw a seed before its first scheduled update. */
    if (this.points.length) sketch.rect(Math.floor(this.points[0].x) - 1, Math.floor(this.points[0].y) - 1, 2, 2);
  }
}
