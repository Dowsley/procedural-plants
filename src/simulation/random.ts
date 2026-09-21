export type Random = () => number;

/** Each plant has its own stream so planting never changes its neighbors. */
export function createRandom(seed: string): Random {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    state = (state + 1831565813) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(random: Random, values: readonly [T, ...T[]]): T {
  return values[Math.floor(random() * values.length)];
}

export function between(random: Random, min: number, max: number): number {
  return min + random() * (max - min);
}
