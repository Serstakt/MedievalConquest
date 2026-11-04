import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Unit, Building, Faction } from './types';

interface UnitsProps {
  units: Unit[];
  factions: Faction[];
  selectedUnits: string[];
  onUnitClick: (unitId: string, shiftKey: boolean) => void;
}

export function Units({ units, factions, selectedUnits, onUnitClick }: UnitsProps) {
  return (
    <group>
      {units.map(unit => (
        <UnitMesh
          key={unit.id}
          unit={unit}
          faction={factions[unit.owner]}
          selected={selectedUnits.includes(unit.id)}
          onClick={(shiftKey) => onUnitClick(unit.id, shiftKey)}
        />
      ))}
    </group>
  );
}

function UnitMesh({ unit, faction, selected, onClick }: {
  unit: Unit;
  faction: Faction;
  selected: boolean;
  onClick: (shiftKey: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(Math.random() * 100);
  
  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      // Idle animation - subtle bobbing
      groupRef.current.position.y = 0.4 + Math.sin(time.current * 2) * 0.03;
      // Slight rotation
      groupRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.1;
    }
  });

  const factionColor = new THREE.Color(faction.color);
  
  return (
    <group position={[unit.pos.x, 0, unit.pos.y]}>
      {/* Selection ring with glow */}
      {selected && (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.55, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.65, 32]} />
            <meshBasicMaterial color={faction.color} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Selection light */}
          <pointLight position={[0, 1, 0]} color={faction.color} intensity={0.5} distance={2} />
        </>
      )}
      
      {/* Shadow blob */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      
      {/* Unit body */}
      <group ref={groupRef}>
        {unit.type === 'warrior' && <WarriorModel color={factionColor} />}
        {unit.type === 'archer' && <ArcherModel color={factionColor} />}
        {unit.type === 'cavalry' && <CavalryModel color={factionColor} />}
        {unit.type === 'catapult' && <CatapultModel color={factionColor} />}
        {unit.type === 'knight' && <KnightModel color={factionColor} />}
      </group>
      
      {/* HP Bar */}
      {unit.hp < unit.maxHp && (
        <HPBar hp={unit.hp} maxHp={unit.maxHp} position={[0, 0.9, 0]} />
      )}
      
      {/* Clickable area */}
      <mesh 
        position={[0, 0.3, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          onClick(e.nativeEvent?.shiftKey || false);
        }}
        visible={false}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function WarriorModel({ color }: { color: THREE.Color }) {
  return (
    <group>
      {/* Legs */}
      <mesh position={[-0.08, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.3, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.3, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      {/* Body - armor */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.4} metalness={0.6} clearcoat={0.3} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[-0.18, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.18, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#808080" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Sword */}
      <group position={[0.25, 0.15, 0]} rotation={[0, 0, -0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.03, 0.35, 0.02]} />
          <meshPhysicalMaterial color="#e0e0e0" roughness={0.1} metalness={0.95} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.04, 0.04]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
      </group>
      {/* Shield */}
      <mesh position={[-0.22, 0.1, 0.05]} rotation={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

function ArcherModel({ color }: { color: THREE.Color }) {
  return (
    <group>
      {/* Legs */}
      <mesh position={[-0.07, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0.07, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      {/* Body - tunic */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.35, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Hood */}
      <mesh position={[0, 0.35, -0.05]} castShadow>
        <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.35, 0.02]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Bow */}
      <group position={[-0.2, 0.15, 0.1]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.18, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
        {/* Bowstring */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, 0.36, 4]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
      </group>
      {/* Quiver */}
      <mesh position={[0.12, 0.2, -0.1]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Arrows in quiver */}
      {[0, 0.02, -0.02].map((offset, i) => (
        <mesh key={i} position={[0.12 + offset, 0.35, -0.1]} castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      ))}
    </group>
  );
}

function CavalryModel({ color }: { color: THREE.Color }) {
  return (
    <group>
      {/* Horse body */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.4, 8, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>
      {/* Horse head */}
      <mesh position={[0, 0.05, 0.3]} rotation={[0.5, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.15, 8, 8]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Horse legs */}
      {[[-0.1, -0.3, -0.15], [0.1, -0.3, -0.15], [-0.1, -0.3, 0.15], [0.1, -0.3, 0.15]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]} castShadow>
          <cylinderGeometry args={[0.035, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#654321" roughness={0.7} />
        </mesh>
      ))}
      {/* Horse tail */}
      <mesh position={[0, 0, -0.3]} rotation={[-0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      {/* Saddle */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Rider body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.3, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Rider head */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshPhysicalMaterial color="#808080" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Lance */}
      <mesh position={[0.15, 0.4, 0.2]} rotation={[0.8, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 0.75, 0.55]} rotation={[0.8, 0, 0]} castShadow>
        <coneGeometry args={[0.03, 0.1, 6]} />
        <meshPhysicalMaterial color="#e0e0e0" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
}

function CatapultModel({ color }: { color: THREE.Color }) {
  return (
    <group>
      {/* Base frame */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.7]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      {/* Cross beams */}
      <mesh position={[0, -0.05, -0.25]} castShadow>
        <boxGeometry args={[0.6, 0.08, 0.08]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.05, 0.25]} castShadow>
        <boxGeometry args={[0.6, 0.08, 0.08]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Wheels */}
      {[[-0.3, -0.2, 0], [0.3, -0.2, 0]].map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], pos[2]]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.12, 0.025, 8, 16]} />
            <meshStandardMaterial color="#4a3728" roughness={0.7} />
          </mesh>
          {/* Spokes */}
          {[0, 1, 2, 3].map(j => (
            <mesh key={j} rotation={[0, 0, Math.PI / 2 + j * Math.PI / 4]} castShadow>
              <boxGeometry args={[0.015, 0.22, 0.015]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Throwing arm */}
      <mesh position={[0, 0.15, -0.1]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.6, 0.06]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Bucket */}
      <mesh position={[0, 0.4, -0.35]} castShadow>
        <sphereGeometry args={[0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      {/* Boulder */}
      <mesh position={[0, 0.42, -0.35]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      {/* Rope/tension */}
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </group>
  );
}

function KnightModel({ color }: { color: THREE.Color }) {
  return (
    <group>
      {/* Legs - armored */}
      <mesh position={[-0.09, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.3, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.09, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.3, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Body - heavy armor */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.45, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.8} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>
      {/* Chest plate detail */}
      <mesh position={[0, 0.15, 0.15]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Large shoulders */}
      <mesh position={[-0.22, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.22, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Helmet - great helm */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.13, 0.2, 8]} />
        <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} clearcoat={1} />
      </mesh>
      {/* Helmet top */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Visor slit */}
      <mesh position={[0, 0.42, 0.13]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Great sword */}
      <group position={[0.28, 0.15, 0]} rotation={[0, 0, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.5, 0.015]} />
          <meshPhysicalMaterial color="#e8e8e8" roughness={0.05} metalness={0.98} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.15, 0.03, 0.03]} />
          <meshPhysicalMaterial color="#ffd700" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.33, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#4a3728" roughness={0.6} />
        </mesh>
      </group>
      {/* Large shield */}
      <mesh position={[-0.25, 0.1, 0.08]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.02, 0.35, 0.25]} />
        <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Shield emblem */}
      <mesh position={[-0.26, 0.1, 0.12]} rotation={[0, 0.4, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshPhysicalMaterial color="#ffd700" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Cape */}
      <mesh position={[0, 0.05, -0.15]} rotation={[0.1, 0, 0]} castShadow>
        <planeGeometry args={[0.3, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HPBar({ hp, maxHp, position }: { hp: number; maxHp: number; position: [number, number, number] }) {
  const ratio = hp / maxHp;
  const color = ratio > 0.6 ? '#22c55e' : ratio > 0.3 ? '#f59e0b' : '#ef4444';
  
  return (
    <group position={position}>
      {/* Background */}
      <mesh>
        <planeGeometry args={[0.6, 0.08]} />
        <meshBasicMaterial color="#1a1a1a" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[0.64, 0.12]} />
        <meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
      </mesh>
      {/* HP fill */}
      <mesh position={[(ratio - 1) * 0.28, 0, 0.001]}>
        <planeGeometry args={[0.56 * ratio, 0.06]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface BuildingsProps {
  buildings: Building[];
  factions: Faction[];
}

export function Buildings({ buildings, factions }: BuildingsProps) {
  return (
    <group>
      {buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          faction={factions[building.owner]}
        />
      ))}
    </group>
  );
}

function BuildingMesh({ building, faction }: { building: Building; faction: Faction }) {
  const hpRatio = building.hp / building.maxHp;
  
  return (
    <group position={[building.pos.x, 0, building.pos.y]}>
      {/* Territory circle */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshBasicMaterial color={faction.color} transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={faction.color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      
      {building.type === 'castle' && <CastleModel factionColor={faction.color} />}
      {building.type === 'barracks' && <BarracksModel factionColor={faction.color} />}
      {building.type === 'farm' && <FarmModel />}
      {building.type === 'lumbermill' && <LumbermillModel />}
      {building.type === 'mine' && <MineModel />}
      {building.type === 'tower' && <TowerModel factionColor={faction.color} />}
      
      {/* HP Bar */}
      {building.hp < building.maxHp && (
        <HPBar 
          hp={building.hp} 
          maxHp={building.maxHp} 
          position={[0, building.type === 'castle' ? 4 : 2.5, 0]} 
        />
      )}
      
      {/* Building light */}
      <pointLight 
        position={[0, 1.5, 0]} 
        color={faction.color} 
        intensity={0.3} 
        distance={3} 
      />
    </group>
  );
}

function CastleModel({ factionColor }: { factionColor: string }) {
  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.2, 0.3, 8]} />
        <meshStandardMaterial color="#696969" roughness={0.8} />
      </mesh>
      {/* Main walls */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1, 1.3, 8]} />
        <meshPhysicalMaterial color={factionColor} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Main tower */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 1.5, 8]} />
        <meshPhysicalMaterial color={factionColor} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Tower roof */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.6, 1, 8]} />
        <meshPhysicalMaterial color="#8B0000" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Corner towers */}
      {[[-0.75, 0, -0.75], [0.75, 0, -0.75], [-0.75, 0, 0.75], [0.75, 0, 0.75]].map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[2]]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 1.4, 6]} />
            <meshPhysicalMaterial color={factionColor} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.22, 0.4, 6]} />
            <meshPhysicalMaterial color="#8B0000" roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Battlements */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.15, 6]} />
            <meshStandardMaterial color="#696969" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Gate */}
      <mesh position={[0, 0.5, 0.95]}>
        <boxGeometry args={[0.4, 0.6, 0.05]} />
        <meshStandardMaterial color="#2d1810" roughness={0.9} />
      </mesh>
      {/* Gate arch */}
      <mesh position={[0, 0.85, 0.95]}>
        <sphereGeometry args={[0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#696969" roughness={0.7} />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.15, 3.7, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.35, 0.25]} />
        <meshStandardMaterial color={factionColor} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      {/* Windows */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.52, 1.8, Math.sin(i * Math.PI / 2) * 0.52]}>
          <boxGeometry args={[0.08, 0.15, 0.02]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function BarracksModel({ factionColor }: { factionColor: string }) {
  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.1, 1.1]} />
        <meshStandardMaterial color="#696969" roughness={0.8} />
      </mesh>
      {/* Main building */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.9, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.3, 0.15, 1.1]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.85, 0.5, 4]} />
        <meshStandardMaterial color="#8B0000" roughness={0.6} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.35, 0.51]}>
        <boxGeometry args={[0.3, 0.5, 0.02]} />
        <meshStandardMaterial color="#2d1810" roughness={0.9} />
      </mesh>
      {/* Weapon rack */}
      <mesh position={[0.5, 0.4, 0.52]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.05]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Swords on rack */}
      {[-0.08, 0, 0.08].map((x, i) => (
        <mesh key={i} position={[0.5 + x, 0.45, 0.55]} castShadow>
          <boxGeometry args={[0.02, 0.3, 0.01]} />
          <meshPhysicalMaterial color="#c0c0c0" roughness={0.1} metalness={0.9} />
        </mesh>
      ))}
      {/* Banner */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 6]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.08, 1.8, 0]}>
        <planeGeometry args={[0.15, 0.12]} />
        <meshStandardMaterial color={factionColor} side={THREE.DoubleSide} />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.35, 0.6, 0.51]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.35, 0.6, 0.51]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function FarmModel() {
  return (
    <group>
      {/* Field */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.6, 1.6]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>
      {/* Crop rows */}
      {[-0.5, -0.25, 0, 0.25, 0.5].map((z, i) => (
        <mesh key={i} position={[-0.1, 0.08, z]} receiveShadow>
          <boxGeometry args={[1, 0.12, 0.08]} />
          <meshStandardMaterial color="#DAA520" roughness={0.8} />
        </mesh>
      ))}
      {/* Farmhouse */}
      <mesh position={[0.5, 0.3, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#DEB887" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.65, -0.5]} castShadow>
        <coneGeometry args={[0.4, 0.35, 4]} />
        <meshStandardMaterial color="#8B0000" roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0.5, 0.2, -0.24]}>
        <boxGeometry args={[0.15, 0.3, 0.02]} />
        <meshStandardMaterial color="#2d1810" roughness={0.9} />
      </mesh>
      {/* Fence */}
      {[-0.7, -0.5, -0.3, 0.3, 0.5, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0.75]} castShadow>
          <boxGeometry args={[0.03, 0.2, 0.03]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0.75]} castShadow>
        <boxGeometry args={[1.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Hay bale */}
      <mesh position={[-0.5, 0.12, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
        <meshStandardMaterial color="#DAA520" roughness={0.9} />
      </mesh>
    </group>
  );
}

function LumbermillModel() {
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Main building */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.7, 0.7]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.65, 0.4, 4]} />
        <meshStandardMaterial color="#4a3728" roughness={0.7} />
      </mesh>
      {/* Saw blade */}
      <mesh position={[0.5, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshPhysicalMaterial color="#c0c0c0" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Log pile */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[-0.4, 0.15 + i * 0.12, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[0.2, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#696969" roughness={0.7} />
      </mesh>
    </group>
  );
}

function MineModel() {
  return (
    <group>
      {/* Rock base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      {/* Mine entrance */}
      <mesh position={[0, 0.3, 0.5]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.55]}>
        <boxGeometry args={[0.35, 0.4, 0.02]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Support beams */}
      <mesh position={[-0.2, 0.3, 0.52]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.3, 0.52]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0.52]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Cart */}
      <mesh position={[0.3, 0.1, 0.6]} castShadow>
        <boxGeometry args={[0.2, 0.12, 0.15]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      {/* Ore in cart */}
      <mesh position={[0.3, 0.18, 0.6]} castShadow>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshPhysicalMaterial color="#ffd700" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Lantern */}
      <mesh position={[0, 0.5, 0.55]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#ffa500" />
      </mesh>
      <pointLight position={[0, 0.5, 0.6]} color="#ffa500" intensity={0.3} distance={1.5} />
    </group>
  );
}

function TowerModel({ factionColor }: { factionColor: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.45, 0.3, 8]} />
        <meshStandardMaterial color="#696969" roughness={0.7} />
      </mesh>
      {/* Tower body */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 1.7, 8]} />
        <meshPhysicalMaterial color="#808080" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Top platform */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.2, 8]} />
        <meshStandardMaterial color="#696969" roughness={0.6} />
      </mesh>
      {/* Battlements */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.38, 2.15, Math.sin(i * Math.PI / 3) * 0.38]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="#696969" roughness={0.6} />
        </mesh>
      ))}
      {/* Arrow slits */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.32, 1.2, Math.sin(i * Math.PI / 2) * 0.32]}>
          <boxGeometry args={[0.04, 0.15, 0.02]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Flag */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 2.6, 0]}>
        <planeGeometry args={[0.2, 0.15]} />
        <meshStandardMaterial color={factionColor} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      {/* Light at top */}
      <pointLight position={[0, 2.2, 0]} color={factionColor} intensity={0.4} distance={4} />
    </group>
  );
}
