export enum TowerType {
  SHREDDER = 'SHREDDER',
  FLAK = 'FLAK',
  PLASMA = 'PLASMA',
  EMP = 'EMP',
  NET_NODE = 'NET_NODE',
  CHEM = 'CHEM',
  DECOY = 'DECOY',
  SCANNER = 'SCANNER'
}

export enum EnemyType {
  SCUM = 'SCUM',
  BIKER = 'BIKER',
  SHIELD = 'SHIELD',
  DRONE = 'DRONE',
  PSYCHO = 'PSYCHO',
  TANK = 'TANK',
  MUTANT = 'MUTANT',
  GHOST = 'GHOST',
  HACKER = 'HACKER'
}

export enum HackType {
  BLACKOUT = 'BLACKOUT',
  LASER = 'LASER',
  OVERRIDE = 'OVERRIDE',
}

export enum MercType {
  SAMURAI = 'SAMURAI',
  HEAVY = 'HEAVY',
  MEDIC = 'MEDIC'
}

export interface Point {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  reward: number;
  isFlying: boolean;
  effects: {
    slowTimer: number;
    freezeTimer: number;
    burnTimer: number;
    burnDamage: number;
    sludgeTimer: number;
  };
  isCloaked?: boolean;
}

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  cooldown: number;
  range: number;
  damage: number;
  fireRate: number; // frames between shots
  targetId: string | null;
  overclockTimer: number;
  overheatTimer: number;
  incomeTimer?: number; // For Net-Node
  stunTimer: number;
}

export interface Merc {
  id: string;
  type: MercType;
  x: number;
  y: number;
  cooldown: number;
  targetId: string | null;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  targetId: string | null;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  type: TowerType;
  splashRadius?: number;
  level: number;
  hasRicocheted?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Pool {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

export enum Faction {
  KURO_SEC = 'KURO_SEC',
  GENE_TEK = 'GENE_TEK',
  GHOST_SYNDICATE = 'GHOST_SYNDICATE',
  NONE = 'NONE'
}

export interface CorpData {
  name: string;
  color: string;
}

export interface PrestigeState {
  sourceCode: number;
  multipliers: {
    globalDamage: number; // e.g., 0 = +0%, 1 = +100%
    offlineMining: number;
    startingCredits: number;
  };
  daemons: {
    autoBuilderLevel: number;
    autoOverclockLevel: number;
  };
}

export interface MainframeState {
  processingPower: number;
  heat: number;
  coolingLevel: number;
  allocations: {
    attackSpeed: number; // 0 to 100
    credGen: number;     // 0 to 100
  };
}

export interface GameState {
  corp: CorpData | null;
  prestige: PrestigeState;
  mainframe: MainframeState;
  currentFaction: Faction;
  factionKills: { [key in Faction]?: number };
  sector: number;
  mapIndex: number;
  credits: number;
  lives: number;
  wave: number;
  enemies: Enemy[];
  towers: Tower[];
  mercs: Merc[];
  projectiles: Projectile[];
  particles: Particle[];
  pools: Pool[];
  floatingTexts: FloatingText[];
  status: 'START' | 'PLAYING' | 'WAVE_COMPLETE' | 'GAME_OVER' | 'VICTORY' | 'BURN_NOTICE';
  dataFragments: number;
  campaignCompleted: boolean;
  isEndless: boolean;
  loanSharkWavesLeft: number;
  loanUsed: boolean;
  waveTimer: number;
  screenGlitch: number;
  sabotageDiscount: number;
  inventory: {
    [key in TowerType]?: number; // Number of cards collected
  };
  upgrades: {
    ricochet: boolean;
    widerSlag: boolean;
    opticalCybereye: boolean;
    creditChip: boolean;
    synapticAccelerator: boolean;
  };
  hacks: {
    [key in HackType]: {
      cooldown: number;
      activeTimer: number;
    };
  };
}
