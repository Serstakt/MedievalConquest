import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GameState, TerrainType } from './types';

interface TerrainProps {
  gameState: GameState;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
}

const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: '#4a7c3f',
  forest: '#2d5a27',
  mountain: '#6b7280',
  water: '#1d4ed8',
  hills: '#7c8a3e',
};

const TERRAIN_HEIGHTS: Record<TerrainType, number> = {
  plains: 0,
  forest: 0.1,
  mountain: 1.2,
  water: -0.3,
  hills: 0.4,
};

export function Terrain({ gameState, onTileClick, onTileHover }: TerrainProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { map, mapWidth, mapHeight, factions } = gameState;

  // Create instanced terrain tiles
  const terrainData = useMemo(() => {
    const tiles: { x: number; y: number; terrain: TerrainType; owner?: number; color: string; height: number }[] = [];
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = map[y][x];
        let color = TERRAIN_COLORS[tile.terrain];
        
        // Apply territory tint
        if (tile.owner !== undefined) {
          const factionColor = factions[tile.owner].color;
          const baseColor = new THREE.Color(color);
          const tintColor = new THREE.Color(factionColor);
          baseColor.lerp(tintColor, 0.3);
          color = '#' + baseColor.getHexString();
        }
        
        tiles.push({
          x,
          y,
          terrain: tile.terrain,
          owner: tile.owner,
          color,
          height: TERRAIN_HEIGHTS[tile.terrain],
        });
      }
    }
    return tiles;
  }, [map, mapWidth, mapHeight, factions]);

  // Group tiles by color for instancing
  const colorGroups = useMemo(() => {
    const groups = new Map<string, typeof terrainData>();
    for (const tile of terrainData) {
      if (!groups.has(tile.color)) {
        groups.set(tile.color, []);
      }
      groups.get(tile.color)!.push(tile);
    }
    return groups;
  }, [terrainData]);

  return (
    <group ref={meshRef}>
      {Array.from(colorGroups.entries()).map(([color, tiles]) => (
        <TerrainInstances key={color} tiles={tiles} color={color} onTileClick={onTileClick} onTileHover={onTileHover} />
      ))}
    </group>
  );
}

function TerrainInstances({ tiles, color, onTileClick, onTileHover }: {
  tiles: { x: number; y: number; terrain: TerrainType; height: number }[];
  color: string;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const matrices = useMemo(() => {
    const temp = new THREE.Matrix4();
    const arr: THREE.Matrix4[] = [];
    
    for (const tile of tiles) {
      temp.makeTranslation(tile.x, tile.height / 2, tile.y);
      temp.scale(new THREE.Vector3(1, Math.max(0.1, tile.height + 0.2), 1));
      arr.push(temp.clone());
    }
    return arr;
  }, [tiles]);

  useMemo(() => {
    if (!meshRef.current) return;
    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, tiles.length]}
      onClick={(e: any) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          const tile = tiles[e.instanceId];
          onTileClick(tile.x, tile.y);
        }
      }}
      onPointerMove={(e: any) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          const tile = tiles[e.instanceId];
          onTileHover(tile.x, tile.y);
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
}

// Water plane
export function WaterPlane({ mapWidth, mapHeight }: { mapWidth: number; mapHeight: number }) {
  return (
    <mesh position={[mapWidth / 2, -0.2, mapHeight / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[mapWidth + 10, mapHeight + 10]} />
      <meshStandardMaterial color="#1e40af" transparent opacity={0.7} />
    </mesh>
  );
}
