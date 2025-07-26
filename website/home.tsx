import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConnectButton } from '@web3modal/react';
import { Link } from 'react-router-dom';

const features = [
  { title: 'Real-time APY Tracking', desc: 'Monitor yields across protocols instantly.' },
  { title: 'Automated Yield Optimization', desc: 'Maximize returns with smart allocation.' },
  { title: 'Snapshot Farming', desc: 'Earn rewards with optimized snapshots.' },
  { title: 'Smart Rebalancing', desc: 'Adjust positions for optimal performance.' },
  { title: 'Whale Copy Trading', desc: 'Follow top traders (Coming Soon).', comingSoon: true },
  { title: 'Strategy Marketplace', desc: 'Discover and share strategies (Coming Soon).', comingSoon: true },
];

const Home: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(window.innerWidth, 500);

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x00f7ff, wireframe: true });
    const token = new THREE.Mesh(geometry, material);
    scene.add(token);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      token.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (event: MouseEvent) => {
      token.rotation.x = (event.clientY / window.innerHeight) * 0.5;
      token.rotation.y = (event.clientX / window.innerWidth) * 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center relative">
        <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ height: '500px' }} />
        <div className="relative z-10 pt-24">
          <h1 className="text-5xl font-bold mb-4">Maximize Your Crypto Yields</h1>
          <p className="text-xl text-gray-300 mb-8">
            Real-time yield optimization across Aave, Morpho, Pendle, and more.
          </p>
          <div className="flex justify-center space-x-4">
            <ConnectButton />
            <Link to="/dashboard" className="btn-secondary">Explore Platform</Link>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {features.map((feature, index) => (
          <div key={index} className="card relative">
            {feature.comingSoon && (
              <span className="absolute top-2 right-2 bg-blue-500 text-xs px-2 py-1 rounded">Coming Soon</span>
            )}
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;