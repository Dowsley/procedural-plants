import { GROWTH, VARIETIES, WORLD } from './config.ts';
import type { Variety } from './config.ts';
import { between, createRandom, pick } from './random.ts';
import { createNoise } from './noise.ts';
import type { Branch, Flower, Leaf } from './types.ts';

export class Plant {
  readonly branches: Branch[] = [];
  readonly leaves: Leaf[] = [];
  readonly flowers: Flower[] = [];
  readonly x: number;
  readonly y: number;
  readonly variety: Variety;
  readonly maxLength: number;
  readonly green: string;
  readonly delay: number;
  private readonly random;
  private readonly noise;
  private tick = 0;
  settled = false;

  constructor(seed: string, x: number, y: number, variety: Variety, delay = 0) {
    this.random = createRandom(seed);
    this.noise = createNoise(createRandom(`${seed}:noise`));
    this.x = x;
    this.y = y;
    this.variety = variety;
    this.delay = delay;
    this.maxLength = between(this.random, 135, 215);
    this.green = pick(this.random, ['#4e7042', '#587848', '#65824c', '#456c4c']);
    this.branches.push(this.makeBranch(x, y, -Math.PI / 2 + between(this.random, -0.12, 0.12), 0, 0));
  }

  private makeBranch(x: number, y: number, angle: number, totalLength: number, depth: number): Branch {
    return { x, y, angle, totalLength, depth, length: 0, dead: false, points: [{ x, y }] };
  }

  update(): void {
    if (this.settled || this.tick++ < this.delay) return;
    const children: Branch[] = [];
    for (const branch of this.branches) {
      if (!branch.dead) this.growBranch(branch, children);
    }
    this.branches.push(...children);
    for (const leaf of this.leaves) leaf.growth = this.ease(leaf.growth);
    for (const flower of this.flowers) {
      flower.growth = this.ease(flower.growth);
      if (this.tick % 4 === 0 && flower.life > 0) this.growCluster(flower);
    }
    this.settled = this.branches.every(branch => branch.dead)
      && this.leaves.every(leaf => leaf.growth === 1)
      && this.flowers.every(flower => flower.growth === 1 && flower.life === 0);
  }

  private ease(value: number): number {
    const next = value + (1 - value) * 0.1;
    return next > 0.995 ? 1 : next;
  }

  private growBranch(branch: Branch, children: Branch[]): void {
    branch.length++;
    branch.totalLength++;
    branch.angle += (this.noise(branch.x * 0.1, branch.y * 0.1) - 0.5) * Math.PI / 16;

    /* A gentle upward bias keeps neighboring plants readable as a garden. */
    branch.angle += Math.sin(-Math.PI / 2 - branch.angle) * 0.012;
    const left = Math.max(12, this.x - 65);
    const right = Math.min(WORLD.width - 12, this.x + 65);
    if (branch.x < left) branch.angle += Math.sin(-branch.angle) * 0.14;
    if (branch.x > right) branch.angle += Math.sin(Math.PI - branch.angle) * 0.14;
    if (branch.y < 30) branch.angle += Math.sin(Math.PI / 2 - branch.angle) * 0.15;
    if (branch.y > this.y - 8 && branch.totalLength > 25) branch.angle += Math.sin(-Math.PI / 2 - branch.angle) * 0.18;
    branch.x = Math.max(3, Math.min(WORLD.width - 3, branch.x + Math.cos(branch.angle)));
    branch.y = Math.max(18, Math.min(this.y, branch.y + Math.sin(branch.angle)));
    branch.points.push({ x: branch.x, y: branch.y });

    if (branch.totalLength >= this.maxLength) {
      if (this.random() < 0.75) this.addFlower(branch);
      branch.dead = true;
      return;
    }

    if (branch.length > GROWTH.minBranchLength && branch.totalLength > 32
      && branch.depth < GROWTH.maxSplits && this.random() < GROWTH.splitChance) {
      const spread = this.noise(branch.x * 0.2 + 100, branch.y * 0.2 + 100) * Math.PI / 4 + Math.PI / 8;
      for (const side of [-1, 1]) {
        children.push(this.makeBranch(branch.x, branch.y, branch.angle + spread * side,
          branch.totalLength + Math.floor(between(this.random, -5, 5)), branch.depth + 1));
      }
      branch.dead = true;
    }

    if (branch.totalLength > 25 && this.random() < 0.03 * Math.ceil(branch.totalLength / 64)) {
      this.leaves.push({ x: branch.x, y: branch.y, angle: branch.angle + between(this.random, -Math.PI / 4, Math.PI / 4),
        side: this.random() < 0.5 ? -1 : 1, size: between(this.random, 1, 1.3), width: between(this.random, 2, 3.5), growth: 0, depth: branch.depth });
    }
    if (branch.totalLength > 45 && this.random() < 0.012) this.addFlower(branch);
  }

  private addFlower(branch: Branch): void {
    const config = VARIETIES[this.variety];
    const kind = pick(this.random, config.flowers);
    const x = Math.round(branch.x);
    const y = Math.round(branch.y);
    this.flowers.push({ x, y, kind, angle: branch.angle, color: pick(this.random, config.colors), growth: 0,
      life: kind === 'radial' || kind === 'bell' ? 0 : kind === 'cluster' ? 8 : 4,
      points: [{ x, y }], petals: Math.floor(between(this.random, 4, 7)),
      size: between(this.random, 2.5, 4.5), alternate: this.random() < 0.5 });
  }

  private growCluster(flower: Flower): void {
    flower.life--;
    const additions: { x: number; y: number }[] = [];
    for (const point of flower.points) {
      if (flower.points.length + additions.length >= GROWTH.maxClusterPoints) break;
      if (this.random() >= (flower.kind === 'cluster' ? 0.3 : 0.14)) continue;
      const angle = between(this.random, 0, Math.PI * 2);
      const distance = flower.kind === 'cluster' ? between(this.random, 2, 5) : 4;
      const candidate = { x: Math.round(point.x + Math.cos(angle) * distance), y: Math.round(point.y + Math.sin(angle) * distance) };
      if ([...flower.points, ...additions].some(other => Math.hypot(other.x - candidate.x, other.y - candidate.y) < 3)) continue;
      additions.push(candidate);
    }
    flower.points.push(...additions);
  }
}
