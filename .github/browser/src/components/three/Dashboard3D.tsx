import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Plane,
  MeshDistortMaterial,
  Float,
  Stars,
  Environment,
  Lightformer,
  ContactShadows,
  Billboard,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Animated floating data nodes
function DataNode({ position, color, scale = 1, data, label }: {
  position: [number, number, number];
  color: string;
  scale?: number;
  data: string;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <Box
          ref={meshRef}
          args={[scale, scale, scale]}
          scale={hovered ? 1.2 : 1}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.6}
            speed={2}
            roughness={0.1}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.2}
            transparent
            opacity={0.8}
          />
        </Box>
        
        {hovered && (
          <Html center>
            <div className="bg-black/80 text-white p-3 rounded-lg border border-purple-500/50 backdrop-blur-sm">
              <div className="text-sm font-bold text-purple-300">{label}</div>
              <div className="text-lg font-mono">{data}</div>
            </div>
          </Html>
        )}
        
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, scale + 0.5, 0]}
            fontSize={0.3}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff"
          >
            {label}
          </Text>
        </Billboard>
      </group>
    </Float>
  );
}

// Animated connection lines between nodes
function ConnectionLines() {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const connections = useMemo(() => {
    const lines = [];
    const points: [number, number, number][] = [
      [-4, 2, -2],
      [4, 2, -2],
      [0, 4, -2],
      [-2, 0, -2],
      [2, 0, -2],
    ];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...points[i]),
          new THREE.Vector3(...points[j])
        ]);
        lines.push(
          <primitive key={`${i}-${j}`} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: "#8b5cf6",
            transparent: true,
            opacity: 0.3
          }))} />
        );
      }
    }
    return lines;
  }, []);

  return <group ref={linesRef}>{connections}</group>;
}

// 3D Chart Visualization
function Chart3D() {
  const groupRef = useRef<THREE.Group>(null);
  const data = [2.5, 4.2, 3.8, 5.1, 3.9, 4.8, 5.5];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[6, -2, -4]}>
      {data.map((height, index) => (
        <Box
          key={index}
          args={[0.5, height, 0.5]}
          position={[index * 0.8 - 2.4, height / 2, 0]}
        >
          <MeshDistortMaterial
            color={`hsl(${270 + index * 15}, 70%, 60%)`}
            distort={0.2}
            speed={1}
            roughness={0.1}
            metalness={0.6}
            emissive={`hsl(${270 + index * 15}, 70%, 30%)`}
            emissiveIntensity={0.3}
          />
        </Box>
      ))}
      <Text
        position={[0, -1, 0]}
        fontSize={0.4}
        color="#8b5cf6"
        anchorX="center"
      >
        Portfolio Performance
      </Text>
    </group>
  );
}

// Particle Field Background
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particlesCount = 1000;
  const positions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8b5cf6"
        size={0.02}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Central Hub Sphere
function CentralHub() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={sphereRef} args={[1.5, 64, 64]} position={[0, 0, -2]}>
      <MeshDistortMaterial
        color="#8b5cf6"
        distort={0.8}
        speed={3}
        roughness={0}
        metalness={1}
        emissive="#4c1d95"
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
}

// Main 3D Scene
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#8b5cf6" />
      <pointLight position={[-10, -10, -5]} color="#10b981" intensity={0.5} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#8b5cf6"
        castShadow
      />

      <ParticleField />
      <CentralHub />
      <ConnectionLines />
      
      <DataNode
        position={[-4, 2, -2]}
        color="#8b5cf6"
        scale={0.8}
        data="$2.5B"
        label="TVL"
      />
      <DataNode
        position={[4, 2, -2]}
        color="#10b981"
        scale={0.9}
        data="15.4%"
        label="APY"
      />
      <DataNode
        position={[0, 4, -2]}
        color="#f59e0b"
        scale={0.7}
        data="50K+"
        label="Users"
      />
      <DataNode
        position={[-2, 0, -2]}
        color="#ef4444"
        scale={0.6}
        data="24/7"
        label="Uptime"
      />
      <DataNode
        position={[2, 0, -2]}
        color="#06b6d4"
        scale={0.8}
        data="99.9%"
        label="Security"
      />

      <Chart3D />

      <ContactShadows
        position={[0, -5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={5}
      />

      <Environment preset="city" />
      <Stars
        radius={50}
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

// Main Dashboard3D Component
export const Dashboard3D: React.FC = () => {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <Scene3D />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-8 left-8 pointer-events-auto"
        >
          <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Matrix Finance Dashboard
            </h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Interact with 3D data nodes</p>
              <p>• Scroll to zoom, drag to rotate</p>
              <p>• Real-time portfolio metrics</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute top-8 right-8 pointer-events-auto"
        >
          <div className="bg-black/40 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-3">
              Live Metrics
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gas Price:</span>
                <span className="text-white">12 gwei</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ETH Price:</span>
                <span className="text-green-400">$2,340</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Block:</span>
                <span className="text-blue-400">#18,534,201</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
