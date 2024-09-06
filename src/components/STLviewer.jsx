import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const STLViewer = forwardRef(({ url }, ref) => {
  const meshRef = useRef();

  useEffect(() => {
    if (url) {
      const loader = new STLLoader();
      loader.load(
        url,
        (geometry) => {
          // Clean up previous geometry
          if (meshRef.current && meshRef.current.geometry) {
            meshRef.current.geometry.dispose();
          }
          
          // Set the new geometry
          if (meshRef.current) {
            meshRef.current.geometry = geometry;
            meshRef.current.scale.set(0.7, 0.7, 0.7);
          }
        },
        undefined,
        (error) => {
          console.error('An error happened while loading the STL file:', error);
        }
      );

      // Clean up function
      return () => {
        if (meshRef.current && meshRef.current.geometry) {
          meshRef.current.geometry.dispose();
        }
      };
    }
  }, [url]);

  // Expose the mesh or scene to parent components
  useImperativeHandle(ref, () => ({
    getScene: () => meshRef.current ? meshRef.current : null,
  }));

  return (
    <Canvas style={{ width: '100%', height: '400px' }}>
      <OrbitControls />
      <ambientLight />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <mesh ref={meshRef} scale={[0.05, 0.05, 0.05]}>
        <meshStandardMaterial color="gray" />
      </mesh> 
    </Canvas>
  );
});

export default STLViewer;
