'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticles({ count = 5000 }) {
  const ref = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;
      
      // Emerald color variations
      colors[i3] = 0.06 + Math.random() * 0.1;     // R
      colors[i3 + 1] = 0.6 + Math.random() * 0.2;  // G
      colors[i3 + 2] = 0.4 + Math.random() * 0.2;  // B
    }
    
    return { positions, colors };
  }, [count]);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.02;
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });
  
  return (
    <Points ref={ref} positions={particles.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function GlowingSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <icosahedronGeometry args={[2, 1]} />
      <meshBasicMaterial 
        color="#10b981" 
        wireframe 
        transparent 
        opacity={0.15}
      />
    </mesh>
  );
}

function FloatingRings() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.x = state.clock.elapsedTime * 0.1;
      group.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={group} position={[0, 0, -8]}>
      {[3, 4, 5, 6].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.5]}>
          <torusGeometry args={[radius, 0.02, 8, 100]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.1 - i * 0.02} 
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="three-canvas">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <FloatingParticles count={3000} />
        <GlowingSphere />
        <FloatingRings />
      </Canvas>
    </div>
  );
}
