import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial, Text, Trail, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface SubElement {
  name: string;
}

interface PlanetProps {
  name: string;
  position: [number, number, number];
  size: number;
  color: string;
  sector?: string;
  isDir: boolean;
  subElements?: SubElement[];
  isOpened?: boolean;
  activity?: number;
  complexity?: number;
  onClick: () => void;
}

const FunctionSatellite = ({ name, index, total, planetSize, color, onClick }: { name: string, index: number, total: number, planetSize: number, color: string, onClick: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  
  // Create a unique orbital path for each satellite
  const orbitRadius = planetSize * 2.5 + (index * 1.5);
  const speed = 0.5 + (index * 0.1);
  const offset = (index / total) * Math.PI * 2;

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * orbitRadius;
      ref.current.position.z = Math.sin(t) * orbitRadius;
      ref.current.position.y = Math.sin(t * 0.5) * (planetSize * 0.5);
    }
  });

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Trail 
        width={1} 
        length={4} 
        color={new THREE.Color(color)} 
        attenuation={(t) => t * t}
      >
        <mesh>
          <sphereGeometry args={[planetSize * 0.15, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Trail>
      <Suspense fallback={null}>
        <Text
          position={[0, planetSize * 0.4, 0]}
          fontSize={planetSize * 0.2}
          color="white"
          anchorX="center"
          maxWidth={2}
          font={undefined} // Use default to avoid loading issues
        >
          {name}
        </Text>
      </Suspense>
    </group>
  );
};

export const Planet = ({ name, position, size, color: originalColor, isDir, subElements, isOpened, activity = 0, complexity = 0, onClick }: PlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Derived visuals
  const complexityFactor = Math.min(complexity / 10, 1);
  const activityFactor = Math.min(activity / 50, 1);
  
  // High complexity planets shift towards red
  const finalColor = useMemo(() => {
    const col = new THREE.Color(originalColor);
    if (complexity > 5) {
        col.lerp(new THREE.Color("#ff3333"), complexityFactor * 0.5);
    }
    return col;
  }, [originalColor, complexity, complexityFactor]);

  const particles = useMemo(() => {
    const temp = [];
    // Directories (Stars) have much denser corona, Files have sparse atmospheres
    const count = isDir ? 100 : (isOpened ? 40 : (8 + Math.floor(activityFactor * 20)));
    for (let i = 0; i < count; i++) {
      const p = new THREE.Vector3().setFromSphericalCoords(
        size * (isDir ? (1.3 + Math.random() * 0.8) : (1.2 + Math.random() * 0.4)),
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );
      temp.push(p.x, p.y, p.z);
    }
    return new Float32Array(temp);
  }, [size, isDir, isOpened, activityFactor]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += isDir ? 0.005 : (0.01 + activityFactor * 0.05);
      meshRef.current.rotation.z += 0.001;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
    if (coreRef.current && isDir) {
        coreRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
  });

  return (
    <Float speed={2 + activityFactor * 4} rotationIntensity={0.5 + complexityFactor} floatIntensity={0.5} position={position}>
      <group>
        {/* Invisible larger hit area to make planets easier to click */}
        <mesh visible={false} onClick={() => { if (!isDir) onClick(); }}>
          <sphereGeometry args={[Math.max(size * 1.5, 8), 8, 8]} />
        </mesh>


        {/* Main Celestial Body (Only for files) */}
        {!isDir && (
            <mesh ref={meshRef}>
              <sphereGeometry args={[size, 128, 128]} />
              <MeshDistortMaterial
                color={finalColor}
                speed={1.0 + activityFactor * 3}
                distort={0.15 + complexityFactor * 0.4}
                radius={1}
                metalness={0.8}
                roughness={0.15 + complexityFactor * 0.2}
                emissive={finalColor}
                emissiveIntensity={0.2 + activityFactor * 1.5}
              />
            </mesh>
        )}



        {/* Labels */}
        <Suspense fallback={null}>
          <Text
            position={[0, size + 2, 0]}
            fontSize={1.0}
            color="white"
            anchorX="center"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {name}
          </Text>
        </Suspense>

        {/* Distance-invariant Glow Point (Ensures visibility when zoomed out) */}
        <Points positions={new Float32Array([0, 0, 0])}>
          <PointMaterial
            transparent
            color={originalColor}
            size={4}
            sizeAttenuation={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.6}
          />
        </Points>

        {/* Atmosphere/Corona Particles */}
        <Points positions={particles}>
          <PointMaterial
            transparent
            color={originalColor}
            size={0.4}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        {/* Function Satellites - Only show when file is opened */}
        {isOpened && !isDir && subElements && (
          <group>
            {subElements.map((el, i) => (
              <FunctionSatellite 
                key={i} 
                name={el.name} 
                index={i} 
                total={subElements.length} 
                planetSize={size} 
                color={originalColor}
                onClick={onClick}
              />
            ))}
          </group>
        )}
      </group>
    </Float>
  );
};
