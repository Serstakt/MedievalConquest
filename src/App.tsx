import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Position, UnitType, BuildingType, UNIT_STATS, BUILDING_STATS } from './game/types';
import { 
  createInitialState, processTurn, moveUnit, trainUnit, buildBuilding, 
  canMoveTo, getUnitEmoji, getBuildingEmoji, getUnitName, getBuildingName 
} from './game/engine';

const TILE_SIZE = 24;

function MiniMap({ gameState, camera, onCameraMove }: { 
  gameState: GameState; 
  camera: Position; 
  onCameraMove: (pos: Position) => void;
}) {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const scale = 2;

  useEffect(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = gameState.mapWidth * scale;
    const h = gameState.mapHeight * scale;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw terrain
    for (let y = 0; y < gameState.mapHeight; y++) {
      for (let x = 0; x < gameState.mapWidth; x++) {
        const tile = gameState.map[y][x];
        let color = '#4a7c3f';
        switch (tile.terrain) {
          case 'forest': color = '#2d5a27'; break;
          case 'mountain': color = '#6b7280'; break;
          case 'water': color = '#2563eb'; break;
          case 'hills': color = '#7c8a3e'; break;
        }
        
        if (tile.owner !== undefined) {
          color = gameState.factions[tile.owner].color;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw units as dots
    for (const unit of gameState.units) {
      ctx.fillStyle = gameState.factions[unit.owner].color;
      ctx.fillRect(unit.pos.x * scale - 1, unit.pos.y * scale - 1, 3, 3);
    }

    // Draw camera viewport
    const viewW = Math.ceil((canvas.parentElement?.clientWidth || 800) / TILE_SIZE);
    const viewH = Math.ceil((canvas.parentElement?.clientHeight || 600) / TILE_SIZE);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(camera.x * scale, camera.y * scale, viewW * scale, viewH * scale);
  }, [gameState, camera, scale]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    onCameraMove({ x: Math.max(0, x - 10), y: Math.max(0, y - 8) });
  };

  return (
    <canvas 
      ref={miniCanvasRef}
      className="border border-gray-600 rounded cursor-pointer"
      onClick={handleClick}
      style={{ width: gameState.mapWidth * scale, height: gameState.mapHeight * scale }}
    />
  );
}

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isPaused, setIsPaused] = useState(true);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showTrainMenu, setShowTrainMenu] = useState(false);
  const [placingBuilding, setPlacingBuilding] = useState<BuildingType | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const playerFaction = gameState.factions.find(f => f.isPlayer);

  // Auto-turn processing
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setGameState(prev => processTurn(prev));
    }, 1200 / gameState.gameSpeed);
    return () => clearInterval(interval);
  }, [isPaused, gameState.gameSpeed]);

  // Check win/lose
  useEffect(() => {
    const player = gameState.factions.find(f => f.isPlayer);
    if (player && !player.alive) setIsPaused(true);
    const aliveFactions = gameState.factions.filter(f => f.alive);
    if (aliveFactions.length === 1 && aliveFactions[0].isPlayer) setIsPaused(true);
  }, [gameState.factions]);

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { camera, map, units, buildings, mapWidth, mapHeight, selectedUnits } = gameState;
    const viewWidth = Math.ceil(canvas.width / TILE_SIZE) + 2;
    const viewHeight = Math.ceil(canvas.height / TILE_SIZE) + 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let vy = -1; vy < viewHeight; vy++) {
      for (let vx = -1; vx < viewWidth; vx++) {
        const mx = camera.x + vx;
        const my = camera.y + vy;
        
        if (mx < 0 || mx >= mapWidth || my < 0 || my >= mapHeight) continue;
        
        const tile = map[my][mx];
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;

        // Terrain
        let color = '#3d6b35';
        switch (tile.terrain) {
          case 'forest': color = '#1e4d1a'; break;
          case 'mountain': color = '#4b5563'; break;
          case 'water': color = '#1d4ed8'; break;
          case 'hills': color = '#5c6b2e'; break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Territory overlay
        if (tile.owner !== undefined) {
          const faction = gameState.factions[tile.owner];
          ctx.fillStyle = faction.color + '35';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Territory border
          ctx.strokeStyle = faction.color + '60';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Grid
        ctx.strokeStyle = '#00000015';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Terrain decoration
        if (tile.terrain === 'forest') {
          ctx.fillStyle = '#0a3d08';
          ctx.font = '10px serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌲', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3);
        } else if (tile.terrain === 'mountain') {
          ctx.font = '10px serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛰️', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3);
        }

        // Building
        if (tile.building) {
          ctx.font = `${TILE_SIZE - 4}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(getBuildingEmoji(tile.building.type), px + TILE_SIZE / 2, py + TILE_SIZE / 2);
          
          if (tile.building.hp < tile.building.maxHp) {
            const hpRatio = tile.building.hp / tile.building.maxHp;
            ctx.fillStyle = '#000000aa';
            ctx.fillRect(px + 2, py + TILE_SIZE - 5, TILE_SIZE - 4, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(px + 2, py + TILE_SIZE - 5, (TILE_SIZE - 4) * hpRatio, 4);
          }
        }
      }
    }

    // Draw units
    for (const unit of units) {
      const vx = unit.pos.x - camera.x;
      const vy = unit.pos.y - camera.y;
      
      if (vx < -1 || vx > viewWidth || vy < -1 || vy > viewHeight) continue;
      
      const px = vx * TILE_SIZE;
      const py = vy * TILE_SIZE;

      const faction = gameState.factions[unit.owner];
      
      // Shadow
      ctx.beginPath();
      ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 2, TILE_SIZE / 2 - 3, TILE_SIZE / 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#00000040';
      ctx.fill();

      // Circle background
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = faction.color + 'dd';
      ctx.fill();
      ctx.strokeStyle = faction.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      if (selectedUnits.includes(unit.id)) {
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Selection glow
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Unit emoji
      ctx.font = `${TILE_SIZE - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getUnitEmoji(unit.type), px + TILE_SIZE / 2, py + TILE_SIZE / 2);

      // HP bar
      if (unit.hp < unit.maxHp) {
        const hpRatio = unit.hp / unit.maxHp;
        ctx.fillStyle = '#000000cc';
        ctx.fillRect(px + 3, py + 1, TILE_SIZE - 6, 3);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(px + 3, py + 1, (TILE_SIZE - 6) * hpRatio, 3);
      }
    }

    // Hover highlight
    if (hoveredTile) {
      const vx = hoveredTile.x - camera.x;
      const vy = hoveredTile.y - camera.y;
      if (vx >= 0 && vy >= 0 && vx < viewWidth && vy < viewHeight) {
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;
        
        ctx.strokeStyle = placingBuilding ? '#22c55eaa' : '#ffffffaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        
        // Show tile info
        if (hoveredTile.x >= 0 && hoveredTile.x < mapWidth && hoveredTile.y >= 0 && hoveredTile.y < mapHeight) {
          const tile = map[hoveredTile.y][hoveredTile.x];
          if (tile.building) {
            ctx.fillStyle = '#000000cc';
            ctx.fillRect(px - 20, py - 20, 80, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${getBuildingEmoji(tile.building.type)} ${tile.building.hp}/${tile.building.maxHp}`, px - 16, py - 8);
          }
        }
      }
    }

    // Move indicator for selected units
    if (selectedUnits.length > 0 && hoveredTile) {
      for (const unitId of selectedUnits) {
        const unit = units.find(u => u.id === unitId);
        if (!unit) continue;
        const vx1 = unit.pos.x - camera.x;
        const vy1 = unit.pos.y - camera.y;
        const vx2 = hoveredTile.x - camera.x;
        const vy2 = hoveredTile.y - camera.y;
        
        ctx.beginPath();
        ctx.moveTo(vx1 * TILE_SIZE + TILE_SIZE / 2, vy1 * TILE_SIZE + TILE_SIZE / 2);
        ctx.lineTo(vx2 * TILE_SIZE + TILE_SIZE / 2, vy2 * TILE_SIZE + TILE_SIZE / 2);
        ctx.strokeStyle = '#ffffff30';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [gameState, hoveredTile, placingBuilding]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // Canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 3;
      setGameState(prev => {
        const camera = { ...prev.camera };
        switch (e.key) {
          case 'ArrowUp': case 'w': case 'W': case 'ц': case 'Ц': camera.y -= speed; break;
          case 'ArrowDown': case 's': case 'S': case 'ы': case 'Ы': camera.y += speed; break;
          case 'ArrowLeft': case 'a': case 'A': case 'ф': case 'Ф': camera.x -= speed; break;
          case 'ArrowRight': case 'd': case 'D': case 'в': case 'В': camera.x += speed; break;
          case ' ': 
            e.preventDefault();
            setIsPaused(p => !p); 
            return prev;
          case 'Escape':
            setPlacingBuilding(null);
            setShowBuildMenu(false);
            setShowTrainMenu(false);
            return { ...prev, selectedUnits: [] };
        }
        camera.x = Math.max(0, Math.min(prev.mapWidth - 20, camera.x));
        camera.y = Math.max(0, Math.min(prev.mapHeight - 15, camera.y));
        return { ...prev, camera };
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE) + gameState.camera.x;
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE) + gameState.camera.y;

    if (placingBuilding) {
      if (x >= 0 && x < gameState.mapWidth && y >= 0 && y < gameState.mapHeight) {
        const pos = { x, y };
        if (canMoveTo(gameState, pos) && !gameState.map[y][x].building) {
          setGameState(prev => buildBuilding(prev, placingBuilding, pos));
        }
      }
      setPlacingBuilding(null);
      return;
    }

    const clickedUnit = gameState.units.find(u => u.pos.x === x && u.pos.y === y && u.owner === 0);
    
    if (clickedUnit) {
      if (e.shiftKey) {
        setGameState(prev => ({
          ...prev,
          selectedUnits: prev.selectedUnits.includes(clickedUnit.id)
            ? prev.selectedUnits.filter(id => id !== clickedUnit.id)
            : [...prev.selectedUnits, clickedUnit.id],
        }));
      } else {
        setGameState(prev => ({ ...prev, selectedUnits: [clickedUnit.id] }));
      }
    } else if (gameState.selectedUnits.length > 0) {
      setGameState(prev => {
        let newState = prev;
        for (const unitId of prev.selectedUnits) {
          newState = moveUnit(newState, unitId, { x, y });
        }
        return newState;
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE) + gameState.camera.x;
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE) + gameState.camera.y;
    setHoveredTile({ x, y });
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setGameState(prev => ({ ...prev, selectedUnits: [] }));
    setPlacingBuilding(null);
  };

  const handleCameraMove = (pos: Position) => {
    setGameState(prev => ({
      ...prev,
      camera: {
        x: Math.max(0, Math.min(prev.mapWidth - 20, pos.x)),
        y: Math.max(0, Math.min(prev.mapHeight - 15, pos.y)),
      }
    }));
  };

  const selectedUnitData = gameState.selectedUnits.length === 1 
    ? gameState.units.find(u => u.id === gameState.selectedUnits[0])
    : null;

  const selectedCount = gameState.selectedUnits.length;
  const playerAlive = playerFaction?.alive ?? false;
  const enemiesAlive = gameState.factions.filter(f => !f.isPlayer && f.alive).length;
  const victory = playerAlive && enemiesAlive === 0;

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 border-b border-amber-900/50 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <span className="text-2xl">⚔️</span> Medieval Conquest
          </h1>
          <div className="text-sm text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
            Ход: <span className="text-white font-bold">{gameState.turn}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="bg-yellow-900/30 px-2 py-0.5 rounded text-yellow-400">💰 {playerFaction?.gold ?? 0}</span>
            <span className="bg-green-900/30 px-2 py-0.5 rounded text-green-400">🌾 {playerFaction?.food ?? 0}</span>
            <span className="bg-amber-900/30 px-2 py-0.5 rounded text-amber-500">🪵 {playerFaction?.wood ?? 0}</span>
            <span className="bg-gray-700/30 px-2 py-0.5 rounded text-gray-300">🪨 {playerFaction?.stone ?? 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setGameState(prev => processTurn(prev))}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-all shadow-lg shadow-blue-900/30"
          >
            ▶ След. ход
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 text-sm rounded-md transition-all shadow-lg ${isPaused ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30' : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'} text-white`}
          >
            {isPaused ? '⏸ Пауза' : '⏵ Авто'}
          </button>
          <button 
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-all"
          >
            🗺️
          </button>
          <button 
            onClick={() => setShowHelp(true)}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-all"
          >
            ❓
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Game Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredTile(null)}
            onContextMenu={handleCanvasRightClick}
          />
          
          {/* Placing building indicator */}
          {placingBuilding && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-900/90 text-green-200 px-4 py-2 rounded-lg text-sm border border-green-600 shadow-lg backdrop-blur-sm">
              🏗️ Размещение: {getBuildingName(placingBuilding)} {getBuildingEmoji(placingBuilding)} — Кликните на карту | ESC для отмены
            </div>
          )}

          {/* Mini Map */}
          {showMiniMap && (
            <div className="absolute bottom-4 left-4 bg-gray-900/80 p-2 rounded-lg border border-gray-600 backdrop-blur-sm">
              <MiniMap gameState={gameState} camera={gameState.camera} onCameraMove={handleCameraMove} />
            </div>
          )}

          {/* Selected units count */}
          {selectedCount > 1 && (
            <div className="absolute top-4 left-4 bg-blue-900/80 text-blue-200 px-3 py-1.5 rounded-lg text-sm border border-blue-600">
              Выделено: {selectedCount} юнитов
            </div>
          )}

          {/* Victory/Defeat overlay */}
          {(!playerAlive || victory) && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center bg-gray-800/90 p-8 rounded-2xl border border-gray-600 shadow-2xl">
                <h2 className={`text-5xl font-bold mb-4 ${victory ? 'text-amber-400' : 'text-red-400'}`}>
                  {victory ? '👑 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
                </h2>
                <p className="text-gray-300 mb-6 text-lg">
                  {victory ? 'Вы покорили все государства! Мир ваш!' : 'Ваше королевство пало...'}
                </p>
                <p className="text-gray-500 mb-4">Ходов прошло: {gameState.turn}</p>
                <button 
                  onClick={() => { setGameState(createInitialState()); setIsPaused(true); }}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all font-bold text-lg shadow-lg"
                >
                  🔄 Новая игра
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-72 bg-gray-800/95 border-l border-gray-700 flex flex-col overflow-hidden shrink-0 backdrop-blur-sm">
          {/* Selected unit info */}
          {selectedUnitData && (
            <div className="p-3 border-b border-gray-700 bg-gray-750">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-lg">{getUnitEmoji(selectedUnitData.type)}</span> 
                {getUnitName(selectedUnitData.type)}
              </h3>
              <div className="text-xs text-gray-400 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>❤️ Здоровье</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(selectedUnitData.hp / selectedUnitData.maxHp) * 100}%`,
                          backgroundColor: selectedUnitData.hp / selectedUnitData.maxHp > 0.5 ? '#22c55e' : selectedUnitData.hp / selectedUnitData.maxHp > 0.25 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className="text-white">{selectedUnitData.hp}/{selectedUnitData.maxHp}</span>
                  </div>
                </div>
                <div className="flex justify-between"><span>⚔️ Атака</span><span className="text-red-400">{selectedUnitData.attack}</span></div>
                <div className="flex justify-between"><span>🛡️ Защита</span><span className="text-blue-400">{selectedUnitData.defense}</span></div>
                <div className="flex justify-between"><span>💨 Скорость</span><span className="text-green-400">{selectedUnitData.speed}</span></div>
                <div className="flex justify-between"><span>🎯 Дальность</span><span className="text-purple-400">{selectedUnitData.range}</span></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Действия</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowTrainMenu(!showTrainMenu); setShowBuildMenu(false); }}
                className={`flex-1 px-2 py-2 text-xs rounded-md transition-all font-medium ${showTrainMenu ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                ⚔️ Обучить
              </button>
              <button 
                onClick={() => { setShowBuildMenu(!showBuildMenu); setShowTrainMenu(false); }}
                className={`flex-1 px-2 py-2 text-xs rounded-md transition-all font-medium ${showBuildMenu ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                🏗️ Строить
              </button>
            </div>
          </div>

          {/* Train menu */}
          {showTrainMenu && (
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Обучение юнитов</h3>
              <div className="space-y-1">
                {(['warrior', 'archer', 'cavalry', 'knight', 'catapult'] as UnitType[]).map(type => {
                  const stats = UNIT_STATS[type];
                  const canAfford = (playerFaction?.gold ?? 0) >= stats.cost.gold && (playerFaction?.food ?? 0) >= stats.cost.food;
                  return (
                    <button
                      key={type}
                      onClick={() => { setGameState(prev => trainUnit(prev, type)); }}
                      disabled={!canAfford}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all flex items-center gap-2 ${canAfford ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                    >
                      <span className="text-base">{getUnitEmoji(type)}</span>
                      <span className="flex-1">{getUnitName(type)}</span>
                      <span className="text-yellow-400">💰{stats.cost.gold}</span>
                      <span className="text-green-400">🌾{stats.cost.food}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Build menu */}
          {showBuildMenu && (
            <div className="p-3 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Строительство</h3>
              <div className="space-y-1">
                {(['barracks', 'farm', 'lumbermill', 'mine', 'tower'] as BuildingType[]).map(type => {
                  const stats = BUILDING_STATS[type];
                  const canAfford = (playerFaction?.gold ?? 0) >= stats.cost.gold && 
                                   (playerFaction?.wood ?? 0) >= stats.cost.wood && 
                                   (playerFaction?.stone ?? 0) >= stats.cost.stone;
                  return (
                    <button
                      key={type}
                      onClick={() => { setPlacingBuilding(type); setShowBuildMenu(false); }}
                      disabled={!canAfford}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all flex items-center gap-2 ${canAfford ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                    >
                      <span className="text-base">{getBuildingEmoji(type)}</span>
                      <span className="flex-1">{getBuildingName(type)}</span>
                      <span className="text-yellow-400 text-[10px]">💰{stats.cost.gold} 🪵{stats.cost.wood} 🪨{stats.cost.stone}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Factions */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Государства</h3>
            <div className="space-y-1.5">
              {gameState.factions.map(f => (
                <div key={f.id} className={`flex items-center gap-2 text-xs ${!f.alive ? 'opacity-30' : ''}`}>
                  <div className="w-3 h-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: f.color }}></div>
                  <span className={`flex-1 ${f.isPlayer ? 'text-white font-bold' : 'text-gray-400'}`}>
                    {f.name}
                  </span>
                  {!f.alive && <span className="text-red-400 text-[10px]">☠️</span>}
                  {f.alive && <span className="text-gray-500 text-[10px]">{gameState.units.filter(u => u.owner === f.id).length}⚔️</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Army count */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ваша империя</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700/50 rounded-md p-2 text-center">
                <div className="text-lg font-bold text-white">{gameState.units.filter(u => u.owner === 0).length}</div>
                <div className="text-gray-500">Юнитов</div>
              </div>
              <div className="bg-gray-700/50 rounded-md p-2 text-center">
                <div className="text-lg font-bold text-white">{gameState.buildings.filter(b => b.owner === 0).length}</div>
                <div className="text-gray-500">Зданий</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider p-3 pb-1">Летопись</h3>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <div className="space-y-1">
                {[...gameState.messages].reverse().slice(0, 30).map((msg, i) => (
                  <div key={i} className={`text-xs py-0.5 ${
                    msg.type === 'combat' ? 'text-red-300' : 
                    msg.type === 'build' ? 'text-green-300' : 
                    msg.type === 'warning' ? 'text-amber-300' : 'text-gray-500'
                  }`}>
                    <span className="text-gray-700 font-mono">[{msg.turn}]</span> {msg.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-600 shadow-2xl">
            <h2 className="text-3xl font-bold text-amber-400 mb-4 flex items-center gap-3">
              <span className="text-4xl">⚔️</span> Medieval Conquest
            </h2>
            <p className="text-amber-200 font-semibold mb-4 text-lg">Стратегия открытого мира средневековых войн!</p>
            
            <div className="text-sm text-gray-300 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-white font-bold mb-2">🎮 Управление:</h3>
                <ul className="space-y-1 text-gray-400">
                  <li>• <kbd className="bg-gray-600 px-1 rounded text-white">WASD</kbd> / <kbd className="bg-gray-600 px-1 rounded text-white">Стрелки</kbd> — камера</li>
                  <li>• <kbd className="bg-gray-600 px-1 rounded text-white">ЛКМ</kbd> — выбор юнита / приказ двигаться</li>
                  <li>• <kbd className="bg-gray-600 px-1 rounded text-white">Shift+ЛКМ</kbd> — выделить несколько</li>
                  <li>• <kbd className="bg-gray-600 px-1 rounded text-white">ПКМ</kbd> — снять выделение</li>
                  <li>• <kbd className="bg-gray-600 px-1 rounded text-white">Пробел</kbd> — пауза / авто-ход</li>
                </ul>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-white font-bold mb-2">🎯 Цель:</h3>
                <p className="text-gray-400">Уничтожьте замки всех 4 вражеских государств, сохранив свой!</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-white font-bold mb-2">⚔️ Юниты:</h3>
                <div className="grid grid-cols-1 gap-1 text-gray-400">
                  <div>⚔️ <b className="text-white">Воин</b> — сбалансированный, дешёвый</div>
                  <div>🏹 <b className="text-white">Лучник</b> — дальний бой, хрупкий</div>
                  <div>🐴 <b className="text-white">Всадник</b> — быстрый, сильный</div>
                  <div>🛡️ <b className="text-white">Рыцарь</b> — элитный, тяжёлый</div>
                  <div>🪨 <b className="text-white">Катапульта</b> — осадная, огромная дальность</div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-white font-bold mb-2">💡 Советы:</h3>
                <ul className="space-y-1 text-gray-400">
                  <li>• Стройте экономику: фермы, шахты, лесопилки</li>
                  <li>• Юниты лечатся рядом с вашими зданиями</li>
                  <li>• Следите за едой — голод убивает!</li>
                  <li>• Башни автоматически стреляют по врагам</li>
                  <li>• Используйте Shift для выделения армий</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl transition-all font-bold text-lg shadow-lg shadow-amber-900/30"
            >
              ⚔️ Начать завоевание!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
