import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, Position } from './types';
import { Terrain, WaterPlane } from './Terrain';
import { Units, Buildings } from './Units3D';

interface GameSceneProps {
  gameState: GameState;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
  onUnitClick: (unitId: string, shiftKey: boolean) => void;
}

function CameraController({ camera }: { camera: Position }) {
  const { camera: threeCamera } = useThree();
  const targetRef = useRef(new THREE.Vector3(camera.x, 0, camera.y));
  
  useEffect(() => {
    targetRef.current.set(camera.x, 0, camera.y);
  }, [camera.x, camera.y]);

  useFrame(() => {
    // Smooth camera follow
    const currentTarget = new THREE.Vector3(
      threeCamera.position.x,
      threeCamera.position.y,
      threeCamera.position.z
    );
    
    // Calculate desired camera position (isometric-like)
    const desiredX = targetRef.current.x + 15;
    const desiredY = 20;
    const desiredZ = targetRef.current.z + 15;
    
    // Smooth lerp
    threeCamera.position.x += (desiredX - threeCamera.position.x) * 0.05;
    threeCamera.position.y += (desiredY - threeCamera.position.y) * 0.05;
    threeCamera.position.z += (desiredZ - threeCamera.position.z) * 0.05;
    
    threeCamera.lookAt(targetRef.current.x, 0, targetRef.current.z);
  });

  return null;
}

function SceneContent({ gameState, onTileClick, onTileHover, onUnitClick }: GameSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight position={[-30, 40, -20]} intensity={0.3} />
      <hemisphereLight args={['#87CEEB', '#4a7c3f', 0.3]} />
      
      {/* Sky */}
      <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} />
      <Stars radius={200} depth={50} count={2000} factor={4} fade speed={1} />
      
      {/* Fog */}
      <fog attach="fog" args={['#87CEEB', 60, 120]} />
      
      {/* Water plane */}
      <WaterPlane mapWidth={gameState.mapWidth} mapHeight={gameState.mapHeight} />
      
      {/* Terrain */}
      <Terrain 
        gameState={gameState} 
        onTileClick={onTileClick} 
        onTileHover={onTileHover} 
      />
      
      {/* Buildings */}
      <Buildings buildings={gameState.buildings} factions={gameState.factions} />
      
      {/* Units */}
      <Units 
        units={gameState.units} 
        factions={gameState.factions} 
        selectedUnits={gameState.selectedUnits}
        onUnitClick={onUnitClick}
      />
      
      {/* Camera controller */}
      <CameraController camera={gameState.camera} />
      
      {/* Orbit controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={60}
        target={[gameState.camera.x, 0, gameState.camera.y]}
      />
    </>
  );
}

export function GameScene(props: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [30, 25, 30], fov: 50, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#87CEEB']} />
      <SceneContent {...props} />
    </Canvas>
  );
}
