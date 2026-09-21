import type { Random } from './random.ts';

const GRADIENTS = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 1], [0, -1]];
const SKEW = (Math.sqrt(3) - 1) / 2;
const UNSKEW = (3 - Math.sqrt(3)) / 6;

/** Two-dimensional simplex noise, mapped to approximately 0..1. */
export function createNoise(random: Random): (x: number, y: number) => number {
  const permutation = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  const perm = [...permutation, ...permutation];

  function contribution(x: number, y: number, gradient: number): number {
    const weight = 0.5 - x * x - y * y;
    if (weight <= 0) return 0;
    const [gx, gy] = GRADIENTS[gradient % 12];
    return weight ** 4 * (gx * x + gy * y);
  }

  return (x, y) => {
    const skew = (x + y) * SKEW;
    const i = Math.floor(x + skew);
    const j = Math.floor(y + skew);
    const unskew = (i + j) * UNSKEW;
    const x0 = x - i + unskew;
    const y0 = y - j + unskew;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const ii = i & 255;
    const jj = j & 255;
    const n0 = contribution(x0, y0, perm[ii + perm[jj]]);
    const n1 = contribution(x0 - i1 + UNSKEW, y0 - j1 + UNSKEW, perm[ii + i1 + perm[jj + j1]]);
    const n2 = contribution(x0 - 1 + 2 * UNSKEW, y0 - 1 + 2 * UNSKEW, perm[ii + 1 + perm[jj + 1]]);
    return 0.5 + 35 * (n0 + n1 + n2);
  };
}
