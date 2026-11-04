export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: number; // faction id
  pos: Position;
  targetPos?: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  selected?: boolean;
}

export type UnitType = 'warrior' | 'archer' | 'cavalry' | 'catapult' | 'knight';

export interface Building {
  id: string;
  type: BuildingType;
  owner: number;
  pos: Position;
  hp: number;
  maxHp: number;
}

export type BuildingType = 'castle' | 'barracks' | 'farm' | 'lumbermill' | 'mine' | 'tower';

export interface Faction {
  id: number;
  name: string;
  color: string;
  gold: number;
  food: number;
  wood: number;
  stone: number;
  isPlayer: boolean;
  alive: boolean;
}

export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  owner?: number;
  building?: Building;
}

export type TerrainType = 'plains' | 'forest' | 'mountain' | 'water' | 'hills';

export interface GameState {
  map: Tile[][];
  units: Unit[];
  factions: Faction[];
  buildings: Building[];
  turn: number;
  mapWidth: number;
  mapHeight: number;
  camera: Position;
  selectedUnits: string[];
  gameSpeed: number;
  messages: GameMessage[];
}

export interface GameMessage {
  text: string;
  turn: number;
  type: 'info' | 'combat' | 'build' | 'warning';
}

export const UNIT_STATS: Record<UnitType, { hp: number; attack: number; defense: number; speed: number; range: number; cost: { gold: number; food: number } }> = {
  warrior: { hp: 100, attack: 15, defense: 10, speed: 2, range: 1, cost: { gold: 50, food: 20 } },
  archer: { hp: 60, attack: 20, defense: 5, speed: 2, range: 4, cost: { gold: 70, food: 15 } },
  cavalry: { hp: 120, attack: 25, defense: 8, speed: 4, range: 1, cost: { gold: 120, food: 40 } },
  catapult: { hp: 80, attack: 40, defense: 3, speed: 1, range: 6, cost: { gold: 200, food: 10 } },
  knight: { hp: 200, attack: 35, defense: 20, speed: 3, range: 1, cost: { gold: 250, food: 60 } },
};

export const BUILDING_STATS: Record<BuildingType, { hp: number; cost: { gold: number; wood: number; stone: number }; description: string }> = {
  castle: { hp: 500, cost: { gold: 500, wood: 200, stone: 300 }, description: 'Главное здание. Потеря - поражение.' },
  barracks: { hp: 200, cost: { gold: 150, wood: 100, stone: 50 }, description: 'Производит воинов и кавалерию.' },
  farm: { hp: 100, cost: { gold: 80, wood: 60, stone: 0 }, description: 'Производит еду (+10/ход).' },
  lumbermill: { hp: 100, cost: { gold: 80, wood: 0, stone: 30 }, description: 'Производит дерево (+8/ход).' },
  mine: { hp: 150, cost: { gold: 100, wood: 50, stone: 0 }, description: 'Производит золото (+15/ход) и камень (+5/ход).' },
  tower: { hp: 150, cost: { gold: 120, wood: 40, stone: 80 }, description: 'Оборонительная башня. Атакует врагов.' },
};
