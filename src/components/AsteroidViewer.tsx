import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function resolveModelUrl(modelPath: string): string {
  // Use Vite's URL resolution so assets under src are bundled correctly
  // Try to resolve relative to this file's directory
  try {
    return new URL(`../assets/asteroids/${modelPath}`, import.meta.url).href;
  } catch {
    // Fallback to root-based path (dev server)
    return `/src/assets/asteroids/${modelPath}`;
  }
}

function Asteroid({ modelPath }: { modelPath: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = React.useState<THREE.Group | null>(null);
  const [scale, setScale] = React.useState(1);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    setModel(null);
    const url = resolveModelUrl(modelPath);
    try {
      const gltf = useGLTF.preload(url) as unknown as { scene: THREE.Group };
      // useGLTF.preload doesn't return the asset immediately; we will load synchronously via hook below
    } catch (e) {
      // Ignore preload errors; actual hook load below will handle
    }
  }, [modelPath]);

  // Load the model via hook
  // This hook must be called unconditionally; derive URL from props but keep stable
  const url = resolveModelUrl(modelPath);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gltfData = useGLTF(url, true) as unknown as { scene: THREE.Group };

  useEffect(() => {
    if (!gltfData?.scene) return;
    try {
      const scene = gltfData.scene.clone(true);
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          child.geometry.translate(-center.x, -center.y, -center.z);
        }
      });
      setModel(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      setScale(maxDim > 0 ? 2.0 / maxDim : 1);
    } catch (e) {
      console.warn("Failed to process model", e);
      setLoadError("Failed to process model");
    }
  }, [gltfData]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (model) {
    // @ts-expect-error Drei types accept primitive
    return <primitive ref={meshRef as any} object={model} scale={scale} />;
  }
  if (loadError) return null;
  return null;
}

export default function AsteroidViewer({ modelPath }: { modelPath: string }) {
  return (
    <div className="w-full h-full min-h-[16rem] bg-black rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 1.2, 3] }}>
        {/* @ts-ignore */}
        <ambientLight intensity={0.6} />
        {/* @ts-ignore */}
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Asteroid modelPath={modelPath} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
