import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Torus,
  MeshDistortMaterial,
  Float,
  Stars,
  Environment,
  ContactShadows,
  Billboard,
  Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Floating geometric shapes
function FloatingShape({ position, rotation, scale, color, shape = 'box' }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  shape?: 'box' | 'sphere' | 'torus';
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
    }
  });

  const Shape = shape === 'sphere' ? Sphere : shape === 'torus' ? Torus : Box;
  const args: any = shape === 'sphere' ? [1, 32, 32] : shape === 'torus' ? [0.8, 0.3, 16, 32] : [1, 1, 1];

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
      <Shape
        ref={meshRef}
        args={args}
        position={position}
        rotation={rotation}
        scale={scale}
      >
        <MeshDistortMaterial
          color={color}
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.1}
          transparent
          opacity={0.7}
        />
      </Shape>
    </Float>
  );
}

// Animated grid background
function GridBackground() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    }
  });

  const lines = useMemo(() => {
    const lineGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const gridSize = 20;
    const gridStep = 2;

    // Horizontal lines
    for (let i = -gridSize; i <= gridSize; i += gridStep) {
      positions.push(-gridSize, 0, i, gridSize, 0, i);
    }

    // Vertical lines
    for (let i = -gridSize; i <= gridSize; i += gridStep) {
      positions.push(i, 0, -gridSize, i, 0, gridSize);
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    return (
      <primitive 
        object={new THREE.LineSegments(
          lineGeometry, 
          new THREE.LineBasicMaterial({ 
            color: '#8b5cf6', 
            transparent: true, 
            opacity: 0.2 
          })
        )} 
      />
    );
  }, []);

  return (
    <group ref={groupRef} position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {lines}
    </group>
  );
}

// Main 3D Hero Scene
function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#8b5cf6" />
      <pointLight position={[-10, -10, -5]} color="#10b981" intensity={0.5} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.2}
        penumbra={1}
        intensity={0.8}
        color="#8b5cf6"
        castShadow
      />

      <GridBackground />
      
      {/* Central focus sphere */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.1}>
        <Sphere args={[2, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#8b5cf6"
            distort={0.8}
            speed={2}
            roughness={0}
            metalness={1}
            emissive="#4c1d95"
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      {/* Floating shapes around the scene */}
      <FloatingShape
        position={[-6, 3, -3]}
        rotation={[0, 0, 0]}
        scale={0.8}
        color="#10b981"
        shape="box"
      />
      <FloatingShape
        position={[6, -2, -2]}
        rotation={[Math.PI / 4, 0, 0]}
        scale={1.2}
        color="#f59e0b"
        shape="sphere"
      />
      <FloatingShape
        position={[-3, -4, 2]}
        rotation={[0, Math.PI / 3, 0]}
        scale={0.6}
        color="#ef4444"
        shape="torus"
      />
      <FloatingShape
        position={[8, 1, 1]}
        rotation={[Math.PI / 6, Math.PI / 4, 0]}
        scale={0.9}
        color="#06b6d4"
        shape="box"
      />
      <FloatingShape
        position={[0, 6, -4]}
        rotation={[0, 0, Math.PI / 4]}
        scale={0.7}
        color="#8b5cf6"
        shape="sphere"
      />

      {/* 3D Text */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, -6, 0]}
          fontSize={0.8}
          color="#8b5cf6"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          MATRIX FINANCE
        </Text>
      </Billboard>

      <Sparkles
        count={100}
        scale={15}
        size={2}
        speed={0.5}
        opacity={0.8}
        color="#8b5cf6"
      />

      <ContactShadows
        position={[0, -8, 0]}
        opacity={0.3}
        scale={30}
        blur={2}
        far={8}
      />

      <Environment preset="city" />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </>
  );
}

// Main Hero Scene 3D Component
export const HeroScene3D: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <HeroScene />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.3}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};
