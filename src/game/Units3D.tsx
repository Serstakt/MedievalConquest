import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Unit, Building, Faction } from './types';

interface UnitsProps {
  units: Unit[];
  factions: Faction[];
  selectedUnits: string[];
  onUnitClick: (unitId: string, shiftKey: boolean) => void;
}

const UNIT_COLORS: Record<string, { body: string; accent: string }> = {
  warrior: { body: '#8B4513', accent: '#C0C0C0' },
  archer: { body: '#228B22', accent: '#8B4513' },
  cavalry: { body: '#8B0000', accent: '#FFD700' },
  catapult: { body: '#4a3728', accent: '#6b5b4a' },
  knight: { body: '#4169E1', accent: '#C0C0C0' },
};

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
  const colors = UNIT_COLORS[unit.type] || { body: '#666', accent: '#999' };
  
  const position: [number, number, number] = [unit.pos.x, 0.4, unit.pos.y];
  
  // Selection ring
  const selectionRing = useMemo(() => {
    if (!selected) return null;
    return (
      <mesh position={[unit.pos.x, 0.05, unit.pos.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    );
  }, [selected, unit.pos.x, unit.pos.y]);

  // HP bar
  const hpRatio = unit.hp / unit.maxHp;
  const hpColor = hpRatio > 0.6 ? '#22c55e' : hpRatio > 0.3 ? '#f59e0b' : '#ef4444';

  return (
    <group ref={groupRef}>
      {/* Selection ring */}
      {selectionRing}
      
      {/* Unit body based on type */}
      <group position={position}>
        {unit.type === 'warrior' && (
          <>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.25, 0.5, 8]} />
              <meshStandardMaterial color={faction.color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.35, 0]} castShadow>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Sword */}
            <mesh position={[0.25, 0.1, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color={colors.accent} metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}
        
        {unit.type === 'archer' && (
          <>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
              <meshStandardMaterial color={faction.color} />
            </mesh>
            <mesh position={[0, 0.35, 0]} castShadow>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Bow */}
            <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.2]} castShadow>
              <torusGeometry args={[0.2, 0.02, 8, 12, Math.PI]} />
              <meshStandardMaterial color={colors.accent} />
            </mesh>
          </>
        )}
        
        {unit.type === 'cavalry' && (
          <>
            {/* Horse body */}
            <mesh position={[0, -0.1, 0]} castShadow>
              <boxGeometry args={[0.3, 0.3, 0.6]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Horse legs */}
            <mesh position={[-0.1, -0.3, -0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            <mesh position={[0.1, -0.3, -0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            <mesh position={[-0.1, -0.3, 0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            <mesh position={[0.1, -0.3, 0.2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Rider */}
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.35, 8]} />
              <meshStandardMaterial color={faction.color} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={colors.accent} />
            </mesh>
          </>
        )}
        
        {unit.type === 'catapult' && (
          <>
            {/* Base */}
            <mesh position={[0, -0.1, 0]} castShadow>
              <boxGeometry args={[0.5, 0.15, 0.7]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Wheels */}
            <mesh position={[-0.3, -0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 12]} />
              <meshStandardMaterial color={colors.accent} />
            </mesh>
            <mesh position={[0.3, -0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 12]} />
              <meshStandardMaterial color={colors.accent} />
            </mesh>
            {/* Arm */}
            <mesh position={[0, 0.15, -0.1]} rotation={[0.5, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 0.5, 0.08]} />
              <meshStandardMaterial color={colors.body} />
            </mesh>
          </>
        )}
        
        {unit.type === 'knight' && (
          <>
            {/* Body - larger */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.3, 0.6, 8]} />
              <meshStandardMaterial color={faction.color} metalness={0.4} roughness={0.3} />
            </mesh>
            {/* Helmet */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial color={colors.accent} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Shield */}
            <mesh position={[-0.3, 0.1, 0]} castShadow>
              <boxGeometry args={[0.05, 0.35, 0.25]} />
              <meshStandardMaterial color={faction.color} metalness={0.3} />
            </mesh>
            {/* Sword */}
            <mesh position={[0.3, 0.15, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
              <boxGeometry args={[0.06, 0.5, 0.06]} />
              <meshStandardMaterial color={colors.accent} metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
        
        {/* HP Bar */}
        {unit.hp < unit.maxHp && (
          <group position={[0, 0.7, 0]}>
            <mesh>
              <planeGeometry args={[0.6, 0.08]} />
              <meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[(hpRatio - 1) * 0.3, 0, 0.001]}>
              <planeGeometry args={[0.6 * hpRatio, 0.06]} />
              <meshBasicMaterial color={hpColor} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Clickable area */}
      <mesh 
        position={[unit.pos.x, 0.3, unit.pos.y]}
        onClick={(e: any) => {
          e.stopPropagation();
          onClick(e.nativeEvent?.shiftKey || false);
        }}
        visible={false}
      >
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
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
  const position: [number, number, number] = [building.pos.x, 0, building.pos.y];
  const hpRatio = building.hp / building.maxHp;
  
  return (
    <group position={position}>
      {building.type === 'castle' && (
        <>
          {/* Main tower */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.7, 2.4, 8]} />
            <meshStandardMaterial color={faction.color} />
          </mesh>
          {/* Tower top */}
          <mesh position={[0, 2.6, 0]} castShadow>
            <coneGeometry args={[0.7, 0.8, 8]} />
            <meshStandardMaterial color="#8B0000" />
          </mesh>
          {/* Walls */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.8, 0.8, 1.8]} />
            <meshStandardMaterial color={faction.color} opacity={0.9} transparent />
          </mesh>
          {/* Corner towers */}
          {[[-0.8, 0, -0.8], [0.8, 0, -0.8], [-0.8, 0, 0.8], [0.8, 0, 0.8]].map((pos, i) => (
            <mesh key={i} position={[pos[0], 0.8, pos[2]]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 1.6, 6]} />
              <meshStandardMaterial color={faction.color} />
            </mesh>
          ))}
          {/* Flag */}
          <mesh position={[0, 3.2, 0]}>
            <boxGeometry args={[0.02, 0.6, 0.02]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[0.15, 3.3, 0]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshStandardMaterial color={faction.color} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      
      {building.type === 'barracks' && (
        <>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.2, 1, 1]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.8, 0.5, 4]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Door */}
          <mesh position={[0, 0.3, 0.51]}>
            <planeGeometry args={[0.3, 0.5]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
        </>
      )}
      
      {building.type === 'farm' && (
        <>
          {/* Field */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshStandardMaterial color="#9acd32" />
          </mesh>
          {/* House */}
          <mesh position={[0.4, 0.3, -0.4]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[0.4, 0.65, -0.4]} castShadow>
            <coneGeometry args={[0.4, 0.3, 4]} />
            <meshStandardMaterial color="#8B0000" />
          </mesh>
          {/* Wheat rows */}
          {[-0.3, 0, 0.3].map((z, i) => (
            <mesh key={i} position={[-0.2, 0.15, z]}>
              <boxGeometry args={[0.6, 0.2, 0.05]} />
              <meshStandardMaterial color="#DAA520" />
            </mesh>
          ))}
        </>
      )}
      
      {building.type === 'lumbermill' && (
        <>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1, 0.8, 0.8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <coneGeometry args={[0.7, 0.5, 4]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          {/* Logs */}
          {[-0.3, 0, 0.3].map((x, i) => (
            <mesh key={i} position={[x + 0.6, 0.1, 0.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.4, 6]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
        </>
      )}
      
      {building.type === 'mine' && (
        <>
          {/* Mountain entrance */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.6]} />
            <meshStandardMaterial color="#696969" />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <coneGeometry args={[0.6, 0.6, 6]} />
            <meshStandardMaterial color="#808080" />
          </mesh>
          {/* Entrance */}
          <mesh position={[0, 0.25, 0.31]}>
            <planeGeometry args={[0.3, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Cart */}
          <mesh position={[0.3, 0.1, 0.4]} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.15]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </>
      )}
      
      {building.type === 'tower' && (
        <>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.35, 1.8, 8]} />
            <meshStandardMaterial color="#808080" />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.3, 0.3, 8]} />
            <meshStandardMaterial color="#696969" />
          </mesh>
          {/* Battlements */}
          {[0, 1, 2, 3].map(i => (
            <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.35, 2.1, Math.sin(i * Math.PI / 2) * 0.35]} castShadow>
              <boxGeometry args={[0.12, 0.2, 0.12]} />
              <meshStandardMaterial color="#696969" />
            </mesh>
          ))}
          {/* Faction banner */}
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[0.02, 0.4, 0.02]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[0.1, 2.5, 0]}>
            <planeGeometry args={[0.2, 0.15]} />
            <meshStandardMaterial color={faction.color} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      
      {/* HP Bar for damaged buildings */}
      {building.hp < building.maxHp && (
        <group position={[0, building.type === 'castle' ? 3.5 : 2, 0]}>
          <mesh>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[(hpRatio - 1) * 0.5, 0, 0.001]}>
            <planeGeometry args={[1 * hpRatio, 0.08]} />
            <meshBasicMaterial 
              color={hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444'} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        </group>
      )}
      
      {/* Territory marker */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshBasicMaterial color={faction.color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
