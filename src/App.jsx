import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AsciiRenderer } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';

import { ASCIIEffect } from './ascii-effect.jsx';

import { useControls } from 'leva';

import './App.css';

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef();
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    const delay = 0.66;
    ref.current.rotation.x += delay * delta;
    ref.current.rotation.y += delay * delta;
  });

  const { scale, radius, tube, tubularSegments, radialSegments, p, q } = useControls({
    radius: 2,
    tube: 0.4,
    tubularSegments: 64,
    radialSegments: 8,
    p: 2,
    q: 3,
    scale: 0.5,
  });

  // const torusArgs = [10, 3, 64, 8];
  const torusArgs = [radius, tube, tubularSegments, radialSegments, p, q];

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 * scale : scale}
      onClick={event => click(!clicked)}
      onPointerOver={event => hover(true)}
      onPointerOut={event => hover(false)}
    >
      <torusKnotGeometry args={torusArgs} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function App() {
  const {chars} = useControls({ chars : ` =mukund`});
  const asciiEffect = React.useMemo(
    () =>
      new ASCIIEffect({
        characters: chars,
        fontSize: 54,
        cellSize: 22,
        color: '#ffffff',
        invert: false,
      }),
    [chars],
  );
  return (
    <Canvas>
      <EffectComposer>
        <primitive object={asciiEffect} />
      </EffectComposer>

      <color attach="background" args={['black']} />

      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <Box position={[0, 0, 0]} />
    </Canvas>
  );
}

export default App;
