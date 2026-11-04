import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping, SSAO } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
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
  const lookAtTarget = useRef(new THREE.Vector3(camera.x, 0, camera.y));
  
  useEffect(() => {
    targetRef.current.set(camera.x, 0, camera.y);
  }, [camera.x, camera.y]);

  useFrame(() => {
    // Smooth camera follow
    const desiredX = targetRef.current.x + 12;
    const desiredY = 18;
    const desiredZ = targetRef.current.z + 12;
    
    // Smooth lerp for position
    threeCamera.position.x += (desiredX - threeCamera.position.x) * 0.04;
    threeCamera.position.y += (desiredY - threeCamera.position.y) * 0.04;
    threeCamera.position.z += (desiredZ - threeCamera.position.z) * 0.04;
    
    // Smooth look-at
    lookAtTarget.current.lerp(targetRef.current, 0.06);
    threeCamera.lookAt(lookAtTarget.current);
  });

  return null;
}

function Particles() {
  return (
    <>
      {/* Dust particles around the map */}
      <Sparkles 
        count={100} 
        scale={[80, 10, 60]} 
        size={1.5} 
        speed={0.3}
        opacity={0.3}
        color="#ffd700"
      />
    </>
  );
}

function SceneContent({ gameState, onTileClick, onTileHover, onUnitClick }: GameSceneProps) {
  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.35} color="#b4c6e0" />
      
      {/* Main sun light with shadows */}
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      
      {/* Fill light */}
      <directionalLight position={[-30, 30, -20]} intensity={0.3} color="#87CEEB" />
      
      {/* Rim light */}
      <directionalLight position={[0, 20, -40]} intensity={0.2} color="#ff9500" />
      
      {/* Hemisphere light for natural ambient */}
      <hemisphereLight args={['#87CEEB', '#4a7c3f', 0.4]} />
      
      {/* Sky */}
      <Sky 
        distance={450000}
        sunPosition={[100, 40, 100]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      
      {/* Stars (subtle) */}
      <Stars radius={200} depth={50} count={1000} factor={3} fade speed={0.5} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#b4c6e0', 50, 100]} />
      
      {/* Environment map for reflections */}
      <Environment preset="sunset" />
      
      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[gameState.mapWidth / 2, 0, gameState.mapHeight / 2]}
        opacity={0.4}
        scale={80}
        blur={2}
        far={10}
        resolution={512}
        color="#000000"
      />
      
      {/* Particles */}
      <Particles />
      
      {/* Water */}
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
      
      {/* Camera */}
      <CameraController camera={gameState.camera} />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 8}
        minDistance={5}
        maxDistance={50}
        panSpeed={1}
        rotateSpeed={0.5}
        zoomSpeed={1.2}
        target={[gameState.camera.x, 0, gameState.camera.y]}
        makeDefault
      />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          intensity={0.3}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette 
          offset={0.3}
          darkness={0.5}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

export function GameScene(props: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [25, 20, 25], fov: 45, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#87CEEB']} />
      <SceneContent {...props} />
    </Canvas>
  );
}
