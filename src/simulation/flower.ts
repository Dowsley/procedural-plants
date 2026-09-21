import type { Sketch } from '../rendering/sketch.ts';
import { FLOWER_TYPES } from './config.ts';
import type { Random } from './random.ts';
import type { Entity, Point } from './types.ts';

export class Flower implements Entity {
  x: number;
  y: number;
  angle: number;
  color: string;
  flowerType = 0;
  flowers: Point[];
  life: number;
  size: number;
  growth = 0;

  constructor(x: number, y: number, angle: number, color: string, random: Random = Math.random) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.angle = angle;
    this.flowerType = Math.floor(random() * 6);
    this.life = FLOWER_TYPES[this.flowerType].life;
    this.size = FLOWER_TYPES[this.flowerType].size;
    this.color = color;
    this.flowers = [{ x: this.x, y: this.y }];
    if (this.flowerType === 5) {
      this.angle = this.angle % (Math.PI * 2);
      const angleToVertical = (Math.PI / 2 - this.angle + Math.PI) % (Math.PI * 2) - Math.PI;
      this.angle += angleToVertical * 0.5;
    }
  }

  update(sketch: Sketch): Entity[] {
    this.growth = sketch.lerp(this.growth, 1, 0.1);
    if (this.life <= 0 || sketch.frameCount % 4 !== 0) return [];
    this.life--;
    const newFlowerPoints: Point[] = [];
    if (this.flowerType === 4) {
      for (const point of this.flowers) {
        const randomAngle = sketch.random() * Math.PI * 2;
        const randomDistance = sketch.random() * 4 + 1;
        const newPoint = {
          x: point.x + Math.round(Math.cos(randomAngle) * randomDistance),
          y: point.y + Math.round(Math.sin(randomAngle) * randomDistance),
        };
        if (sketch.random() < 0.3) newFlowerPoints.push(newPoint);
      }
    } else {
      for (const point of this.flowers) {
        const directions = [{ x: 2, y: 1 }, { x: -2, y: 1 }, { x: 1, y: 2 }, { x: 1, y: -2 }];
        for (const direction of directions) {
          const spacing = this.size;
          const newPoint = { x: point.x + direction.x * spacing, y: point.y + direction.y * spacing };
          const tooClose = this.flowers.some(existingPoint => {
            const dx = existingPoint.x - newPoint.x;
            const dy = existingPoint.y - newPoint.y;
            return Math.sqrt(dx * dx + dy * dy) < spacing * 2;
          });
          if (!tooClose && sketch.random() < 0.1) newFlowerPoints.push(newPoint);
        }
      }
    }
    this.flowers.push(...newFlowerPoints);
    return [];
  }

  draw(sketch: Sketch): void {
    sketch.push();
    sketch.noStroke();
    sketch.noSmooth();

    function makeSeededRandom(seed: number): Random {
      return () => {
        let value = seed += 1831565813;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }
    const random = makeSeededRandom(this.x * 1000);

    for (const point of this.flowers) {
      if (this.flowerType === 0) {
        sketch.fill(this.color);
        sketch.rect(point.x - 1, point.y, 2, 3);
        sketch.rect(point.x + 2, point.y, 2, 3);
        sketch.rect(point.x, point.y - 1, 3, 2);
        sketch.rect(point.x, point.y + 2, 3, 2);
        sketch.fill('white');
        sketch.rect(point.x + 1, point.y + 1, 1, 1);
      } else if (this.flowerType === 2) {
        sketch.fill(this.color);
        sketch.rect(point.x - 1, point.y - 1, 3, 3);
        sketch.fill('white');
        sketch.rect(point.x, point.y, 1, 1);
      } else if (this.flowerType === 3) {
        const flowerColor = this.color;
        sketch.fill(flowerColor);
        const width = Math.round(random() * 2 + 4);
        const height = Math.round(random() * 2 + 4);
        sketch.rect(point.x - 2, point.y - 2, width, height);
        sketch.fill(sketch.lerpColor(sketch.color(flowerColor), sketch.color('white'), 0.2));
        sketch.rect(point.x - 1, point.y - 1, width - 2, height - 2);
        sketch.fill(flowerColor);
        sketch.rect(point.x, point.y, 1, 1);
      } else if (this.flowerType === 4) {
        for (let layer = 0; layer < 5; layer++) {
          sketch.fill(this.color);
          sketch.ellipse(point.x, point.y, 5, 5);
        }
      } else if (this.flowerType === 1) {
        const petalCount = Math.floor(random() * 3) + 4;
        let petalLength = Math.floor(random() * 5) + 2;
        petalLength = petalLength * this.growth;
        const alternatingColors = random() < 0.5;
        for (let petal = 0; petal < petalCount; petal++) {
          const petalAngle = petal / petalCount * Math.PI * 2 + this.angle;
          const petalX = point.x + Math.cos(petalAngle) * (petalLength - 1);
          const petalY = point.y + Math.sin(petalAngle) * (petalLength - 1);
          if (alternatingColors && petal % 2 === 0) {
            sketch.fill(sketch.lerpColor(sketch.color(this.color), sketch.color('white'), 0.3));
          } else {
            sketch.fill(this.color);
          }
          sketch.ellipse(petalX, petalY, petalLength, petalLength);
        }
        let centerColor = sketch.color(this.color);
        sketch.colorMode(sketch.HSB);
        centerColor = sketch.color((sketch.hue(centerColor) + 15) % 360,
          sketch.saturation(centerColor), sketch.brightness(centerColor) / 2);
        const whiteCenter = sketch.lerpColor(sketch.color(this.color), sketch.color('white'), 0.5);
        sketch.fill(random() < 0.5 ? whiteCenter : centerColor);
        sketch.ellipse(point.x, point.y, petalLength + 1, petalLength + 1);
      } else if (this.flowerType === 5) {
        const flowerSize = 11 + Math.floor(random() * 5);
        const openingAngle = random() * 0.2 + 0.3;
        const darkColor = sketch.lerpColor(sketch.color(this.color), sketch.color('black'), 0.4);
        const flowerPoint = point;
        for (let stem = 0; stem < 5; stem++) {
          sketch.stroke(darkColor);
          sketch.noFill();
          sketch.beginShape();
          sketch.vertex(flowerPoint.x + Math.cos(this.angle) * (flowerSize / 2) * this.growth,
            flowerPoint.y + Math.sin(this.angle) * (flowerSize / 2) * this.growth);
          const stemExtension = 1.1 * this.growth;
          sketch.vertex(flowerPoint.x + Math.cos(this.angle) * flowerSize * stemExtension,
            flowerPoint.y + Math.sin(this.angle) * flowerSize * stemExtension);
          sketch.endShape();
        }
        for (let petal = 0; petal < 5; petal++) {
          sketch.fill(this.color);
          sketch.noStroke();
          sketch.ellipse(flowerPoint.x + Math.cos(this.angle) * flowerSize / 3,
            flowerPoint.y + Math.sin(this.angle) * flowerSize / 3, 3, 3);
          sketch.beginShape();
          sketch.vertex(flowerPoint.x, flowerPoint.y);
          for (let i = 0; i <= 6; i++) {
            sketch.vertex(flowerPoint.x + Math.cos(this.angle - openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6),
              flowerPoint.y + Math.sin(this.angle - openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6));
          }
          sketch.vertex(flowerPoint.x + Math.cos(this.angle) * flowerSize * 0.8,
            flowerPoint.y + Math.sin(this.angle) * flowerSize * 0.8);
          for (let i = 6; i >= 0; i--) {
            sketch.vertex(flowerPoint.x + Math.cos(this.angle + openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6),
              flowerPoint.y + Math.sin(this.angle + openingAngle * this.growth * (i / 6)) * flowerSize * (i / 6));
          }
          sketch.endShape(sketch.CLOSE);
        }
        sketch.noStroke();
        sketch.fill('#286428ff');
        sketch.ellipse(point.x + Math.cos(this.angle), point.y + Math.sin(this.angle), 4, 4);
      }
    }

    if (this.flowerType === 4) {
      for (let connectLine = 0; connectLine < 5; connectLine++) {
        sketch.stroke(sketch.lerpColor(sketch.color(this.color), sketch.color('white'), 0.5));
        sketch.strokeWeight(1);
        sketch.noFill();
        sketch.beginShape();
        for (const point of this.flowers) sketch.vertex(point.x, point.y);
        sketch.endShape(sketch.CLOSE);
      }
    }
    sketch.pop();
  }
}
