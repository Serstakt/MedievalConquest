import '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js elements
      mesh: any;
      group: any;
      instancedMesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      lineBasicMaterial: any;
      line: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      float32BufferAttribute: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      fog: any;
      fogExp2: any;
      // drei components
      orbitControls: any;
      text: any;
      html: any;
      sky: any;
      stars: any;
      grid: any;
      perspectiveCamera: any;
      orthographicCamera: any;
    }
  }
}
