import { TowerType, EnemyType, MercType, Point } from './types';

export const GRID_SIZE = 40;
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;

export const MERC_STATS = {
  [MercType.SAMURAI]: {
    name: 'Street Samurai',
    cost: 1500,
    speed: 2.5,
    damage: 150,
    range: 50,
    fireRate: 2, // attacks per second
    color: '#ff0055',
    desc: 'Fast melee assassin. Hunts down enemies.'
  },
  [MercType.HEAVY]: {
    name: 'Heavy-Borg',
    cost: 2500,
    speed: 0.8,
    damage: 40,
    range: 150,
    fireRate: 10,
    color: '#ff8800',
    desc: 'Slow tank. Unleashes a hail of bullets.'
  },
  [MercType.MEDIC]: {
    name: 'Combat Medic',
    cost: 1200,
    speed: 1.8,
    damage: 0,
    range: 120,
    fireRate: 5,
    color: '#00ff88',
    desc: 'Roams and instantly cools/unstuns towers.'
  }
};

export const MAP_PATHS: Point[][] = [
  // Map 1: Original
  [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 300 },
    { x: 600, y: 300 },
    { x: 600, y: 150 },
    { x: 700, y: 150 },
    { x: 700, y: 500 },
    { x: 300, y: 500 },
    { x: 300, y: 600 },
  ],
  // Map 2: The S-Curve
  [
    { x: 100, y: 0 },
    { x: 100, y: 400 },
    { x: 300, y: 400 },
    { x: 300, y: 100 },
    { x: 500, y: 100 },
    { x: 500, y: 500 },
    { x: 700, y: 500 },
    { x: 700, y: 600 },
  ],
  // Map 3: The Spiral
  [
    { x: 0, y: 50 },
    { x: 750, y: 50 },
    { x: 750, y: 550 },
    { x: 100, y: 550 },
    { x: 100, y: 150 },
    { x: 600, y: 150 },
    { x: 600, y: 450 },
    { x: 250, y: 450 },
    { x: 250, y: 600 },
  ],
  // Map 4: The Serpentine Split
  [
    { x: 800, y: 400 },
    { x: 450, y: 400 },
    { x: 450, y: 200 },
    { x: 600, y: 200 },
    { x: 600, y: 100 },
    { x: 150, y: 100 },
    { x: 150, y: 500 },
    { x: 350, y: 500 },
    { x: 350, y: 600 },
  ]
];

export const TOWER_STATS = {
  [TowerType.SHREDDER]: {
    cost: [50, 100, 200],
    range: [120, 140, 160],
    damage: [10, 25, 50],
    fireRate: [15, 12, 8], // frames
    name: 'Shredder Turret',
    desc: 'Cheap, fast-firing kinetic damage.',
    color: '#00ffcc',
  },
  [TowerType.FLAK]: {
    cost: [75, 150, 300],
    range: [150, 200, 250],
    damage: [20, 45, 100],
    fireRate: [30, 25, 20],
    name: 'Flak Array',
    desc: 'Anti-air only. Fast-tracking missiles.',
    color: '#ff00ff',
  },
  [TowerType.PLASMA]: {
    cost: [100, 200, 400],
    range: [100, 120, 150],
    damage: [40, 90, 200],
    fireRate: [60, 55, 50],
    splash: [60, 80, 100],
    name: 'Plasma Bombard',
    desc: 'Slow fire rate, massive AoE damage.',
    color: '#0066ff',
  },
  [TowerType.EMP]: {
    cost: [80, 160, 320],
    range: [100, 120, 150],
    damage: [0, 0, 0],
    fireRate: [60, 50, 40],
    slowFactor: [0.5, 0.3, 0], // 0 means freeze at max level
    slowDuration: [120, 150, 120], // frames
    name: 'EMP Emitter',
    desc: 'Slows enemies. Max level freezes them.',
    color: '#ffff00',
  },
  [TowerType.NET_NODE]: {
    cost: [150, 300, 600],
    range: [0, 0, 150], // Range for hijack at max level
    damage: [0, 0, 0],
    fireRate: [300, 240, 180], // Income generation rate
    income: [25, 60, 150],
    name: 'Net-Node',
    desc: 'Generates passive Crypto-Creds.',
    color: '#00ff00',
  },
  [TowerType.CHEM]: {
    cost: [120, 240, 480],
    range: [90, 110, 130],
    damage: [5, 10, 20],
    fireRate: [10, 8, 5],
    name: 'Toxic Purger',
    desc: 'Sprays bio-sludge. Combos with Plasma for explosions.',
    color: '#33ff33',
  },
  [TowerType.DECOY]: {
    cost: [50, 100, 200],
    range: [0, 0, 0],
    damage: [0, 0, 0],
    fireRate: [999, 999, 999],
    name: 'Holo-Decoy',
    desc: 'Distracts enemies. Place on path.',
    color: '#00ffff',
  },
  [TowerType.SCANNER]: {
    cost: [100, 200, 400],
    range: [150, 200, 250],
    damage: [0, 0, 0],
    fireRate: [60, 60, 60],
    name: 'Scanner Node',
    desc: 'Reveals cloaked enemies in range.',
    color: '#ffffff',
  },
};

export const ENEMY_STATS = {
  [EnemyType.SCUM]: { hp: 75, speed: 1.8, reward: 4, isFlying: false, color: '#ff3333', size: 10 },
  [EnemyType.BIKER]: { hp: 120, speed: 3.5, reward: 8, isFlying: false, color: '#ff9900', size: 12 },
  [EnemyType.SHIELD]: { hp: 400, speed: 1.2, reward: 15, isFlying: false, color: '#cccccc', size: 16 },
  [EnemyType.DRONE]: { hp: 90, speed: 2.5, reward: 6, isFlying: true, color: '#33ccff', size: 10 },
  [EnemyType.PSYCHO]: { hp: 2000, speed: 1.0, reward: 100, isFlying: false, color: '#ff0000', size: 24 },
  [EnemyType.TANK]: { hp: 5000, speed: 0.6, reward: 250, isFlying: false, color: '#660000', size: 30 },
  [EnemyType.MUTANT]: { hp: 600, speed: 1.4, reward: 20, isFlying: false, color: '#33ff33', size: 18 },
  [EnemyType.GHOST]: { hp: 150, speed: 3.0, reward: 25, isFlying: false, color: '#ffffff', size: 10 },
  [EnemyType.HACKER]: { hp: 300, speed: 1.8, reward: 40, isFlying: false, color: '#ffff00', size: 14 },
};

export const WAVES = [
  { count: 10, type: EnemyType.SCUM, interval: 60 },
  { count: 12, type: EnemyType.SCUM, interval: 55 },
  { count: 15, type: EnemyType.BIKER, interval: 50 },
  { count: 15, type: EnemyType.MUTANT, interval: 45 },
  { count: 18, type: EnemyType.DRONE, interval: 40 },
  { count: 12, type: EnemyType.SHIELD, interval: 50 },
  { count: 20, type: EnemyType.GHOST, interval: 40 },
  { count: 25, type: EnemyType.DRONE, interval: 35 },
  { count: 4, type: EnemyType.PSYCHO, interval: 70 },
  { count: 20, type: EnemyType.HACKER, interval: 40 },
  { count: 30, type: EnemyType.SHIELD, interval: 30 },
  { count: 30, type: EnemyType.MUTANT, interval: 25 },
  { count: 4, type: EnemyType.TANK, interval: 80 },
];
