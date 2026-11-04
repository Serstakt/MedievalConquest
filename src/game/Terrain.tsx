import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GameState, TerrainType } from './types';

interface TerrainProps {
  gameState: GameState;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
}

const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: '#5a8c4f',
  forest: '#2d5a27',
  mountain: '#7b8290',
  water: '#2563eb',
  hills: '#8c9a4e',
};

const TERRAIN_HEIGHTS: Record<TerrainType, number> = {
  plains: 0,
  forest: 0.15,
  mountain: 1.5,
  water: -0.4,
  hills: 0.5,
};

// Generate procedural noise texture
function createNoiseTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const noise = Math.random() * 40 + 215;
    imageData.data[i * 4] = noise;
    imageData.data[i * 4 + 1] = noise;
    imageData.data[i * 4 + 2] = noise;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate grass texture
function createGrassTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Base green
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(0, 0, size, size);
  
  // Add grass blades
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random() * 60 + 40;
    ctx.fillStyle = `rgb(${shade + 30}, ${shade + 80}, ${shade + 20})`;
    ctx.fillRect(x, y, 1, Math.random() * 4 + 1);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Generate stone texture
function createStoneTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, size, size);
  
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 8 + 2;
    const shade = Math.random() * 40 + 80;
    ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 10})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function Terrain({ gameState, onTileClick, onTileHover }: TerrainProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { map, mapWidth, mapHeight, factions } = gameState;

  const grassTexture = useMemo(() => createGrassTexture(), []);
  const stoneTexture = useMemo(() => createStoneTexture(), []);
  const noiseTexture = useMemo(() => createNoiseTexture(), []);

  const terrainData = useMemo(() => {
    const tiles: { x: number; y: number; terrain: TerrainType; owner?: number; color: string; height: number }[] = [];
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = map[y][x];
        let color = TERRAIN_COLORS[tile.terrain];
        
        if (tile.owner !== undefined) {
          const factionColor = factions[tile.owner].color;
          const baseColor = new THREE.Color(color);
          const tintColor = new THREE.Color(factionColor);
          baseColor.lerp(tintColor, 0.25);
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

  // Group by terrain type for different materials
  const terrainGroups = useMemo(() => {
    const groups: Record<string, typeof terrainData> = {};
    for (const tile of terrainData) {
      const key = tile.terrain;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tile);
    }
    return groups;
  }, [terrainData]);

  return (
    <group ref={meshRef}>
      {/* Base terrain plane with grass */}
      <mesh position={[mapWidth / 2, -0.05, mapHeight / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[mapWidth, mapHeight]} />
        <meshStandardMaterial 
          map={grassTexture}
          roughness={0.9}
          metalness={0}
          color="#5a8c4f"
        />
      </mesh>

      {/* Terrain tiles by type */}
      {Object.entries(terrainGroups).map(([terrainType, tiles]) => (
        <TerrainGroup 
          key={terrainType}
          tiles={tiles}
          terrainType={terrainType as TerrainType}
          grassTexture={grassTexture}
          stoneTexture={stoneTexture}
          noiseTexture={noiseTexture}
          onTileClick={onTileClick}
          onTileHover={onTileHover}
        />
      ))}

      {/* Water */}
      <WaterSurface mapWidth={mapWidth} mapHeight={mapHeight} />
    </group>
  );
}

function TerrainGroup({ tiles, terrainType, grassTexture, stoneTexture, noiseTexture, onTileClick, onTileHover }: {
  tiles: { x: number; y: number; terrain: TerrainType; owner?: number; color: string; height: number }[];
  terrainType: TerrainType;
  grassTexture: THREE.Texture;
  stoneTexture: THREE.Texture;
  noiseTexture: THREE.Texture;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const matrices = useMemo(() => {
    const temp = new THREE.Matrix4();
    const arr: THREE.Matrix4[] = [];
    
    for (const tile of tiles) {
      temp.identity();
      const h = Math.max(0.1, tile.height + 0.15);
      temp.makeScale(1, h, 1);
      temp.setPosition(tile.x, h / 2, tile.y);
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

  // Set colors per instance
  useMemo(() => {
    if (!meshRef.current) return;
    const colors = new Float32Array(tiles.length * 3);
    tiles.forEach((tile, i) => {
      const color = new THREE.Color(tile.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }, [tiles]);

  const getMaterial = () => {
    switch (terrainType) {
      case 'forest':
        return (
          <meshStandardMaterial 
            map={grassTexture}
            roughness={0.85}
            metalness={0.05}
            vertexColors
          />
        );
      case 'mountain':
        return (
          <meshStandardMaterial 
            map={stoneTexture}
            roughness={0.7}
            metalness={0.2}
            vertexColors
          />
        );
      case 'hills':
        return (
          <meshStandardMaterial 
            map={noiseTexture}
            roughness={0.8}
            metalness={0.1}
            vertexColors
          />
        );
      default:
        return (
          <meshStandardMaterial 
            map={grassTexture}
            roughness={0.9}
            metalness={0}
            vertexColors
          />
        );
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, tiles.length]}
      castShadow
      receiveShadow
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
      {getMaterial()}
    </instancedMesh>
  );
}

function WaterSurface({ mapWidth, mapHeight }: { mapWidth: number; mapHeight: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <group>
      {/* Deep water */}
      <mesh position={[mapWidth / 2, -0.35, mapHeight / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[mapWidth + 20, mapHeight + 20]} />
        <meshPhysicalMaterial 
          color="#1e3a8a"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.85}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Water surface shimmer */}
      <mesh ref={meshRef} position={[mapWidth / 2, -0.25, mapHeight / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[mapWidth + 20, mapHeight + 20, 32, 32]} />
        <meshPhysicalMaterial 
          color="#3b82f6"
          roughness={0.05}
          metalness={0.5}
          transparent
          opacity={0.4}
          envMapIntensity={2}
        />
      </mesh>
    </group>
  );
}

export function WaterPlane({ mapWidth, mapHeight }: { mapWidth: number; mapHeight: number }) {
  return <WaterSurface mapWidth={mapWidth} mapHeight={mapHeight} />;
}
