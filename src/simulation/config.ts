import type { Random } from './random.ts';

export const WORLD = { width: 640, height: 320, ground: 278, maxPlants: 24, initialPlants: 9 } as const;
export const PLANT = { width: 160, height: 240, rootX: 120, rootY: 240 } as const;
export const MAX_BRANCH_LENGTH = 160;
export const GRAVITY = 0;

export function createPalette(random: Random = Math.random): string[] {
  const colors = ['#ff69b4', '#ff6450ff', '#fee65aff', '#b6c2ffff', '#8570dbff', '#bf3de0ff', '#0b5e16ff'];
  if (random() < 0.95) {
    const numColors = Math.round(random() * 0.6) + 2;
    while (colors.length > numColors) colors.splice(Math.floor(random() * colors.length), 1);
  }
  return colors;
}

export const FLOWER_TYPES = [
  { size: 2, life: 5 },
  { size: 1, life: 0 },
  { size: 1, life: 10 },
  { size: 2, life: 5 },
  { size: 3, life: 10 },
  { size: 3, life: 0 },
] as const;
