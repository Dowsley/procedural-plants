export const WORLD = { width: 640, height: 320, ground: 278, maxPlants: 24, initialPlants: 9 } as const;
export const GROWTH = { ticksPerSecond: 30, splitChance: 0.04, maxSplits: 4, minBranchLength: 16, maxClusterPoints: 24 } as const;

export type Variety = 'mixed' | 'cosmos' | 'bluebell' | 'marigold';
export type FlowerKind = 'cross' | 'radial' | 'simple' | 'square' | 'cluster' | 'bell';

interface VarietyConfig {
  label: string;
  colors: readonly [string, ...string[]];
  flowers: readonly [FlowerKind, ...FlowerKind[]];
}

export const VARIETIES: Record<Variety, VarietyConfig> = {
  mixed: { label: 'Wild mix', colors: ['#d88b9f', '#e6b64e', '#a49bc7', '#d57559'], flowers: ['cross', 'radial', 'simple', 'square', 'cluster', 'bell'] },
  cosmos: { label: 'Cosmos', colors: ['#d17a91', '#e5a1ae', '#bd647f'], flowers: ['cross', 'radial'] },
  bluebell: { label: 'Bluebells', colors: ['#9388bc', '#a9a3d1', '#787aaa'], flowers: ['bell'] },
  marigold: { label: 'Marigolds', colors: ['#e6b64e', '#d7973d', '#ecc978'], flowers: ['square', 'radial'] },
};
