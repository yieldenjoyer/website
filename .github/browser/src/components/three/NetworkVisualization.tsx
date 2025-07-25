import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode {
  id: string;
  position: [number, number, number];
  connections: string[];
  value: number;
  protocol: string;
  color: string;
}

export const NetworkVisualization: React.FC = () => {
  const networkRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const connectionsRef = useRef<THREE.Group>(null);

  // Generate network nodes representing DeFi protocols
  const networkData = useMemo(() => {
    const protocols = [
      { name: 'AAVE', color: '#B6509E', value: 0.8 },
      { name: 'COMPOUND', color: '#00D395', value: 0.7 },
      { name: 'UNISWAP', color: '#FF007A', value: 0.9 },
      { name: 'CURVE', color: '#40E0D0', value: 0.6 },
      { name: 'YEARN', color: '#0074D9', value: 0.75 },
      { name: 'SUSHI', color: '#FA52A0', value: 0.65 },
      { name: 'MAKER', color: '#1AAB9B', value: 0.85 },
      { name: 'SYNTHX', color: '#9013FE', value: 0.55 }
    ];

    const nodes: NetworkNode[] = protocols.map((protocol, i) => {
      const angle = (i / protocols.length) * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      return {
        id: protocol.name,
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 4,
          Math.sin(angle) * radius
        ] as [number, number, number],
        connections: protocols
          .filter((_, j) => j !== i && Math.random() > 0.4)
          .map(p => p.name)
          .slice(0, 3),
        value: protocol.value,
        protocol: protocol.name,
        color: protocol.color
      };
    });

    return nodes;
  }, []);

  // Create connection lines
  const connectionLines = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number]; opacity: number }[] = [];
    
    networkData.forEach(node => {
      node.connections.forEach(connectionId => {
        const targetNode = networkData.find(n => n.id === connectionId);
        if (targetNode) {
          lines.push({
            start: node.position,
            end: targetNode.position,
            opacity: Math.min(node.value, targetNode.value) * 0.8
          });
        }
      });
    });

    return lines;
  }, [networkData]);

  // Animate the network
  useFrame((state) => {
    if (networkRef.current) {
      networkRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      networkRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <group ref={networkRef}>
      {/* Protocol nodes */}
      {networkData.map((node, index) => (
        <group key={node.id} position={node.position}>
          {/* Main node sphere */}
          <mesh>
            <sphereGeometry args={[0.1 + node.value * 0.1, 16, 16]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Pulsing ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15 + node.value * 0.1, 0.25 + node.value * 0.15, 32]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.3 + Math.sin(Date.now() * 0.003 + index) * 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Protocol label */}
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.1}
            color={node.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/monospace.ttf"
          >
            {node.protocol}
          </Text>
        </group>
      ))}

      {/* Connection lines */}
      <group ref={connectionsRef}>
        {connectionLines.map((line, index) => (
          <Line
            key={index}
            points={[line.start, line.end]}
            color="#00ff41"
            lineWidth={1}
            transparent
            opacity={line.opacity * (0.3 + Math.sin(Date.now() * 0.002 + index) * 0.2)}
          />
        ))}
      </group>

      {/* Data flow particles */}
      <Points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={new Float32Array(
              Array.from({ length: 600 }, () => (Math.random() - 0.5) * 20)
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#00ff41"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};
