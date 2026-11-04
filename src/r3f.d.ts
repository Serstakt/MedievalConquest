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
      ringGeometry: any;
      torusGeometry: any;
      circleGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      meshPhysicalMaterial: any;
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
      environment: any;
      contactShadows: any;
      softShadows: any;
      sparkles: any;
      float: any;
      useTexture: any;
      // postprocessing
      effectComposer: any;
      bloom: any;
      vignette: any;
      depthOfField: any;
      toneMapping: any;
      ssao: any;
    }
  }
}
