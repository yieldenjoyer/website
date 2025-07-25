import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedText: React.FC<{ text: string; position: [number, number, number] }> = ({ text, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <Text
        ref={meshRef}
        position={position}
        fontSize={0.8}
        color="#00ff41"
        anchorX="center"
        anchorY="middle"
        font="/fonts/matrix.woff"
        maxWidth={10}
        textAlign="center"
      >
        {text}
        <meshStandardMaterial 
          color="#00ff41" 
          emissive="#002200"
          emissiveIntensity={0.3}
        />
      </Text>
    </Float>
  );
};

const MatrixParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const particles = new Float32Array(100 * 3);
  for (let i = 0; i < 100; i++) {
    particles[i * 3] = (Math.random() - 0.5) * 20;
    particles[i * 3 + 1] = (Math.random() - 0.5) * 20;
    particles[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ff41"
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.6}
      />
    </points>
  );
};

export const MatrixFinanceLogo: React.FC = () => {
  return (
    <div className="w-full h-32 relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Background particles */}
        <MatrixParticles />
        
        {/* Sparkles effect */}
        <Sparkles
          count={50}
          scale={[10, 5, 10]}
          size={2}
          speed={0.3}
          color="#00ff41"
        />
        
        {/* Main logo text */}
        <AnimatedText text="MATRIX FINANCE" position={[0, 0, 0]} />
        
        {/* Subtitle */}
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.3}
          color="#00aa00"
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
          textAlign="center"
        >
          DeFi Yield Optimization Platform
          <meshStandardMaterial 
            color="#00aa00" 
            emissive="#001100"
            emissiveIntensity={0.2}
          />
        </Text>
      </Canvas>
    </div>
  );
};
