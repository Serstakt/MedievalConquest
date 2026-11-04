import { GameState, Tile, Faction, Unit, Building, Position, TerrainType, UnitType, BuildingType, UNIT_STATS, BUILDING_STATS, GameMessage } from './types';

let nextId = 0;
const genId = () => `id_${nextId++}`;

export function generateMap(width: number, height: number): Tile[][] {
  const map: Tile[][] = [];
  
  // Simple terrain generation with noise-like patterns
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      let terrain: TerrainType = 'plains';
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.3) + Math.sin(x * 0.1 + y * 0.1) * 2;
      
      if (noise > 1.5) terrain = 'mountain';
      else if (noise > 0.8) terrain = 'hills';
      else if (noise > 0.3 && Math.random() > 0.6) terrain = 'forest';
      else if (noise < -1.2) terrain = 'water';
      
      map[y][x] = { x, y, terrain };
    }
  }
  
  // Add some rivers
  const riverStart = Math.floor(Math.random() * height);
  let ry = riverStart;
  for (let rx = 0; rx < width; rx++) {
    if (ry >= 0 && ry < height) {
      map[ry][rx].terrain = 'water';
      if (ry + 1 < height) map[ry + 1][rx].terrain = 'water';
    }
    ry += Math.floor(Math.random() * 3) - 1;
    ry = Math.max(0, Math.min(height - 1, ry));
  }
  
  return map;
}

export function createInitialState(): GameState {
  const mapWidth = 80;
  const mapHeight = 60;
  const map = generateMap(mapWidth, mapHeight);
  
  const factionNames = ['Королевство Альдор', 'Империя Вестмар', 'Княжество Нордхейм', 'Республика Саутгард', 'Орда Крови'];
  const factionColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];
  
  const factions: Faction[] = factionNames.map((name, i) => ({
    id: i,
    name,
    color: factionColors[i],
    gold: 300,
    food: 200,
    wood: 150,
    stone: 100,
    isPlayer: i === 0,
    alive: true,
  }));
  
  const buildings: Building[] = [];
  const units: Unit[] = [];
  
  // Place factions on the map
  const factionPositions: Position[] = [
    { x: 10, y: 10 },
    { x: 65, y: 10 },
    { x: 10, y: 45 },
    { x: 65, y: 45 },
    { x: 38, y: 28 },
  ];
  
  factionPositions.forEach((pos, factionId) => {
    // Ensure area is plains
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const tx = pos.x + dx;
        const ty = pos.y + dy;
        if (tx >= 0 && tx < mapWidth && ty >= 0 && ty < mapHeight) {
          map[ty][tx].terrain = 'plains';
          map[ty][tx].owner = factionId;
        }
      }
    }
    
    // Place castle
    const castle: Building = {
      id: genId(),
      type: 'castle',
      owner: factionId,
      pos: { ...pos },
      hp: BUILDING_STATS.castle.hp,
      maxHp: BUILDING_STATS.castle.hp,
    };
    buildings.push(castle);
    map[pos.y][pos.x].building = castle;
    
    // Place some initial buildings
    const initialBuildings: { type: BuildingType; dx: number; dy: number }[] = [
      { type: 'barracks', dx: 2, dy: 0 },
      { type: 'farm', dx: -2, dy: 1 },
      { type: 'lumbermill', dx: 0, dy: -2 },
      { type: 'mine', dx: 2, dy: -1 },
      { type: 'tower', dx: -1, dy: -2 },
    ];
    
    initialBuildings.forEach(b => {
      const bx = pos.x + b.dx;
      const by = pos.y + b.dy;
      if (bx >= 0 && bx < mapWidth && by >= 0 && by < mapHeight) {
        const building: Building = {
          id: genId(),
          type: b.type,
          owner: factionId,
          pos: { x: bx, y: by },
          hp: BUILDING_STATS[b.type].hp,
          maxHp: BUILDING_STATS[b.type].hp,
        };
        buildings.push(building);
        map[by][bx].building = building;
      }
    });
    
    // Place initial units
    const initialUnits: { type: UnitType; dx: number; dy: number }[] = [
      { type: 'warrior', dx: 3, dy: 0 },
      { type: 'warrior', dx: 3, dy: 1 },
      { type: 'warrior', dx: 3, dy: -1 },
      { type: 'archer', dx: 4, dy: 0 },
      { type: 'archer', dx: 4, dy: 1 },
      { type: 'cavalry', dx: -3, dy: 0 },
      { type: 'cavalry', dx: -3, dy: 1 },
    ];
    
    initialUnits.forEach(u => {
      const ux = pos.x + u.dx;
      const uy = pos.y + u.dy;
      const stats = UNIT_STATS[u.type];
      units.push({
        id: genId(),
        type: u.type,
        owner: factionId,
        pos: { x: ux, y: uy },
        hp: stats.hp,
        maxHp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        range: stats.range,
      });
    });
  });
  
  return {
    map,
    units,
    factions,
    buildings,
    turn: 1,
    mapWidth,
    mapHeight,
    camera: { x: factionPositions[0].x - 10, y: factionPositions[0].y - 8 },
    selectedUnits: [],
    gameSpeed: 1,
    messages: [{ text: 'Добро пожаловать в Medieval Conquest! Покорите все государства!', turn: 1, type: 'info' }],
  };
}

export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function canMoveTo(state: GameState, pos: Position): boolean {
  if (pos.x < 0 || pos.x >= state.mapWidth || pos.y < 0 || pos.y >= state.mapHeight) return false;
  const tile = state.map[pos.y][pos.x];
  if (tile.terrain === 'water' || tile.terrain === 'mountain') return false;
  return true;
}

export function moveUnit(state: GameState, unitId: string, target: Position): GameState {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return state;
  
  // Move towards target step by step (limited by speed)
  const dx = target.x - unit.pos.x;
  const dy = target.y - unit.pos.y;
  const dist = Math.abs(dx) + Math.abs(dy);
  
  if (dist === 0) return state;
  
  const steps = Math.min(unit.speed, dist);
  let newX = unit.pos.x;
  let newY = unit.pos.y;
  
  for (let i = 0; i < steps; i++) {
    const cdx = target.x - newX;
    const cdy = target.y - newY;
    
    let moveX = 0, moveY = 0;
    if (Math.abs(cdx) >= Math.abs(cdy)) {
      moveX = cdx > 0 ? 1 : -1;
    } else {
      moveY = cdy > 0 ? 1 : -1;
    }
    
    const nextPos = { x: newX + moveX, y: newY + moveY };
    if (canMoveTo(state, nextPos)) {
      newX = nextPos.x;
      newY = nextPos.y;
    }
  }
  
  const newUnits = state.units.map(u => 
    u.id === unitId ? { ...u, pos: { x: newX, y: newY }, targetPos: target } : u
  );
  
  return { ...state, units: newUnits };
}

export function resolveCombat(state: GameState): GameState {
  const newUnits = state.units.map(u => ({ ...u }));
  const newBuildings = state.buildings.map(b => ({ ...b }));
  const newMessages: GameMessage[] = [...state.messages];
  const toRemove: string[] = [];
  
  // Unit vs Unit combat
  for (let i = 0; i < newUnits.length; i++) {
    const unit = newUnits[i];
    if (toRemove.includes(unit.id)) continue;
    
    for (let j = i + 1; j < newUnits.length; j++) {
      const enemy = newUnits[j];
      if (toRemove.includes(enemy.id)) continue;
      if (unit.owner === enemy.owner) continue;
      
      const dist = getDistance(unit.pos, enemy.pos);
      
      if (dist <= unit.range) {
        const damage = Math.max(1, unit.attack - enemy.defense * 0.5 + Math.random() * 5);
        enemy.hp -= damage;
        
        if (enemy.hp <= 0) {
          toRemove.push(enemy.id);
          newMessages.push({ text: `${getUnitEmoji(unit.type)} уничтожил ${getUnitEmoji(enemy.type)}!`, turn: state.turn, type: 'combat' });
        }
      }
      
      if (dist <= enemy.range && enemy.hp > 0) {
        const damage = Math.max(1, enemy.attack - unit.defense * 0.5 + Math.random() * 5);
        unit.hp -= damage;
        
        if (unit.hp <= 0) {
          toRemove.push(unit.id);
          newMessages.push({ text: `${getUnitEmoji(enemy.type)} уничтожил ${getUnitEmoji(unit.type)}!`, turn: state.turn, type: 'combat' });
        }
      }
    }
  }
  
  // Units attack buildings
  for (const unit of newUnits) {
    if (toRemove.includes(unit.id)) continue;
    
    for (const building of newBuildings) {
      if (unit.owner === building.owner) continue;
      const dist = getDistance(unit.pos, building.pos);
      
      if (dist <= unit.range) {
        const damage = Math.max(1, unit.attack - 5 + Math.random() * 3);
        building.hp -= damage;
        
        if (building.hp <= 0) {
          newMessages.push({ 
            text: `${getUnitEmoji(unit.type)} разрушил ${getBuildingEmoji(building.type)}!`, 
            turn: state.turn, 
            type: 'combat' 
          });
        }
      }
    }
  }
  
  // Tower attacks
  for (const building of newBuildings) {
    if (building.type !== 'tower' || building.hp <= 0) continue;
    
    for (const unit of newUnits) {
      if (unit.owner === building.owner) continue;
      const dist = getDistance(unit.pos, building.pos);
      
      if (dist <= 4) {
        const damage = Math.max(1, 15 - unit.defense * 0.3);
        unit.hp -= damage;
        
        if (unit.hp <= 0) {
          toRemove.push(unit.id);
        }
      }
    }
  }
  
  // Remove dead units and buildings
  const survivingUnits = newUnits.filter(u => !toRemove.includes(u.id));
  const survivingBuildings = newBuildings.filter(b => b.hp > 0);
  
  // Update map buildings
  const newMap = state.map.map(row => row.map(tile => {
    if (tile.building && !survivingBuildings.find(b => b.id === tile.building!.id)) {
      return { ...tile, building: undefined };
    }
    return { ...tile };
  }));
  
  // Check faction elimination
  const newFactions = state.factions.map(f => ({ ...f }));
  for (const faction of newFactions) {
    if (!faction.alive) continue;
    const hasCastle = survivingBuildings.some(b => b.type === 'castle' && b.owner === faction.id);
    if (!hasCastle) {
      faction.alive = false;
      newMessages.push({ text: `⚔️ ${faction.name} пало! Их земли захвачены!`, turn: state.turn, type: 'warning' });
    }
  }
  
  return { ...state, units: survivingUnits, buildings: survivingBuildings, messages: newMessages, map: newMap, factions: newFactions };
}

export function processTurn(state: GameState): GameState {
  let newState = { ...state, turn: state.turn + 1, messages: [...state.messages], factions: state.factions.map(f => ({ ...f })), units: state.units.map(u => ({ ...u })) };
  
  // Resource generation
  for (const faction of newState.factions) {
    if (!faction.alive) continue;
    
    const factionBuildings = newState.buildings.filter(b => b.owner === faction.id);
    
    let goldIncome = 5;
    let foodIncome = 5;
    let woodIncome = 3;
    let stoneIncome = 2;
    
    for (const building of factionBuildings) {
      switch (building.type) {
        case 'farm': foodIncome += 10; break;
        case 'lumbermill': woodIncome += 8; break;
        case 'mine': goldIncome += 15; stoneIncome += 5; break;
        case 'castle': goldIncome += 10; break;
      }
    }
    
    const unitUpkeep = newState.units.filter(u => u.owner === faction.id).length * 2;
    foodIncome -= unitUpkeep;
    
    faction.gold += goldIncome;
    faction.food += foodIncome;
    faction.wood += woodIncome;
    faction.stone += stoneIncome;
    
    if (faction.food < 0) {
      faction.food = 0;
      const factionUnits = newState.units.filter(u => u.owner === faction.id);
      if (factionUnits.length > 0) {
        const victim = factionUnits[Math.floor(Math.random() * factionUnits.length)];
        const victimIdx = newState.units.findIndex(u => u.id === victim.id);
        if (victimIdx >= 0) {
          newState.units[victimIdx] = { ...newState.units[victimIdx], hp: newState.units[victimIdx].hp - 20 };
          if (newState.units[victimIdx].hp <= 0) {
            newState.units = newState.units.filter(u => u.id !== victim.id);
            newState.messages.push({ text: `💀 Воин ${faction.name} погиб от голода!`, turn: newState.turn, type: 'warning' });
          }
        }
      }
    }
  }
  
  // AI turns
  newState = processAI(newState);
  
  // Combat resolution
  newState = resolveCombat(newState);
  
  // Heal units near own buildings
  newState = { ...newState, units: newState.units.map(unit => {
    const nearBuilding = newState.buildings.find(b => b.owner === unit.owner && getDistance(unit.pos, b.pos) <= 2);
    if (nearBuilding && unit.hp < unit.maxHp) {
      return { ...unit, hp: Math.min(unit.maxHp, unit.hp + 5) };
    }
    return unit;
  })};
  
  return newState;
}

function processAI(state: GameState): GameState {
  let currentUnits = [...state.units.map(u => ({ ...u }))];
  const currentFactions = state.factions.map(f => ({ ...f }));
  
  for (const faction of currentFactions) {
    if (faction.isPlayer || !faction.alive) continue;
    
    const myUnits = currentUnits.filter(u => u.owner === faction.id);
    const enemyUnits = currentUnits.filter(u => u.owner !== faction.id);
    const enemyBuildings = state.buildings.filter(b => b.owner !== faction.id);
    
    // Train units if resources allow
    const barracks = state.buildings.filter(b => b.owner === faction.id && b.type === 'barracks');
    if (barracks.length > 0 && Math.random() > 0.4) {
      const unitTypes: UnitType[] = ['warrior', 'archer', 'cavalry'];
      const type = unitTypes[Math.floor(Math.random() * unitTypes.length)];
      const cost = UNIT_STATS[type].cost;
      
      if (faction.gold >= cost.gold && faction.food >= cost.food) {
        faction.gold -= cost.gold;
        faction.food -= cost.food;
        
        const barrack = barracks[Math.floor(Math.random() * barracks.length)];
        const stats = UNIT_STATS[type];
        currentUnits.push({
          id: genId(),
          type,
          owner: faction.id,
          pos: { x: barrack.pos.x + Math.floor(Math.random() * 3) - 1, y: barrack.pos.y + 1 },
          hp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          speed: stats.speed,
          range: stats.range,
        });
      }
    }
    
    // Move units towards enemies
    for (const unit of myUnits) {
      if (Math.random() > 0.6) continue;
      
      let target: Position | null = null;
      let nearestDist = Infinity;
      
      for (const enemy of enemyUnits) {
        const dist = getDistance(unit.pos, enemy.pos);
        if (dist < nearestDist) {
          nearestDist = dist;
          target = enemy.pos;
        }
      }
      
      if (!target || nearestDist > 15) {
        for (const building of enemyBuildings) {
          const dist = getDistance(unit.pos, building.pos);
          if (dist < nearestDist) {
            nearestDist = dist;
            target = building.pos;
          }
        }
      }
      
      if (target) {
        const tempState = { ...state, units: currentUnits };
        const result = moveUnit(tempState, unit.id, target);
        currentUnits = result.units;
      }
    }
  }
  
  return { ...state, units: currentUnits, factions: currentFactions };
}

export function trainUnit(state: GameState, unitType: UnitType): GameState {
  const faction = state.factions.find(f => f.isPlayer);
  if (!faction) return state;
  
  const cost = UNIT_STATS[unitType].cost;
  if (faction.gold < cost.gold || faction.food < cost.food) return state;
  
  const barracks = state.buildings.filter(b => b.owner === faction.id && b.type === 'barracks');
  if (barracks.length === 0) return state;
  
  const barrack = barracks[0];
  const stats = UNIT_STATS[unitType];
  
  faction.gold -= cost.gold;
  faction.food -= cost.food;
  
  const newUnit: Unit = {
    id: genId(),
    type: unitType,
    owner: faction.id,
    pos: { x: barrack.pos.x + 1, y: barrack.pos.y },
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    range: stats.range,
  };
  
  return {
    ...state,
    units: [...state.units, newUnit],
    messages: [...state.messages, { text: `🏋️ Обучен ${getUnitName(unitType)}!`, turn: state.turn, type: 'build' }],
  };
}

export function buildBuilding(state: GameState, buildingType: BuildingType, pos: Position): GameState {
  const faction = state.factions.find(f => f.isPlayer);
  if (!faction) return state;
  
  const cost = BUILDING_STATS[buildingType].cost;
  if (faction.gold < cost.gold || faction.wood < cost.wood || faction.stone < cost.stone) return state;
  
  if (!canMoveTo(state, pos)) return state;
  if (state.map[pos.y][pos.x].building) return state;
  
  faction.gold -= cost.gold;
  faction.wood -= cost.wood;
  faction.stone -= cost.stone;
  
  const building: Building = {
    id: genId(),
    type: buildingType,
    owner: faction.id,
    pos,
    hp: BUILDING_STATS[buildingType].hp,
    maxHp: BUILDING_STATS[buildingType].hp,
  };
  
  const newMap = state.map.map(row => row.map(tile => ({ ...tile })));
  newMap[pos.y][pos.x].building = building;
  
  return {
    ...state,
    map: newMap,
    buildings: [...state.buildings, building],
    messages: [...state.messages, { text: `🏗️ Построено ${getBuildingName(buildingType)}!`, turn: state.turn, type: 'build' }],
  };
}

export function getUnitEmoji(type: UnitType): string {
  switch (type) {
    case 'warrior': return '⚔️';
    case 'archer': return '🏹';
    case 'cavalry': return '🐴';
    case 'catapult': return '🪨';
    case 'knight': return '🛡️';
  }
}

export function getBuildingEmoji(type: BuildingType): string {
  switch (type) {
    case 'castle': return '🏰';
    case 'barracks': return '⚒️';
    case 'farm': return '🌾';
    case 'lumbermill': return '🪵';
    case 'mine': return '⛏️';
    case 'tower': return '🗼';
  }
}

export function getUnitName(type: UnitType): string {
  switch (type) {
    case 'warrior': return 'Воин';
    case 'archer': return 'Лучник';
    case 'cavalry': return 'Всадник';
    case 'catapult': return 'Катапульта';
    case 'knight': return 'Рыцарь';
  }
}

export function getBuildingName(type: BuildingType): string {
  switch (type) {
    case 'castle': return 'Замок';
    case 'barracks': return 'Казарма';
    case 'farm': return 'Ферма';
    case 'lumbermill': return 'Лесопилка';
    case 'mine': return 'Шахта';
    case 'tower': return 'Башня';
  }
}
