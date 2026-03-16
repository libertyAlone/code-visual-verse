import { useRef, useMemo, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Float, Text, Trail, Billboard } from "@react-three/drei";
import * as THREE from "three";

// Pre-load textures for performance
const texturePaths = {
  rocky: '/textures/rocky.png',
  gas_giant: '/textures/gas_giant.png',
  atmospheric: '/textures/atmospheric.png',
  continental: '/textures/continental.png'
};

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
          anchorY="middle"
          maxWidth={2}
        >
          {name}
        </Text>
      </Suspense>
    </group>
  );
};

export const Planet = ({ name, position, size, color: originalColor, isDir, subElements, isOpened, activity = 0, complexity = 0, onClick }: PlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Load all textures
  const textures = {
      rocky: useLoader(THREE.TextureLoader, texturePaths.rocky),
      gas: useLoader(THREE.TextureLoader, texturePaths.gas_giant),
      atmo: useLoader(THREE.TextureLoader, texturePaths.atmospheric),
      cont: useLoader(THREE.TextureLoader, texturePaths.continental),
  };

  // Ensure textures wrap and fill properly
  useMemo(() => {
    Object.values(textures).forEach(tex => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 1);
    });
  }, [textures]);

  // Derived visuals
  const complexityFactor = Math.min(complexity / 20, 1);
  const activityFactor = Math.min(activity / 100, 1);
  
  // Select texture based on characteristics
  const selectedTexture = useMemo(() => {
    if (complexity > 30) return textures.gas;
    if (size > 20) return textures.cont;
    if (subElements && subElements.length > 10) return textures.atmo;
    return textures.rocky;
  }, [complexity, size, subElements, textures]);

  const finalColor = useMemo(() => {
    const col = new THREE.Color(originalColor);
    // Shift color towards a "hotter" spectrum for complex files
    if (complexity > 5) {
        col.lerp(new THREE.Color("#ff3300"), complexityFactor * 0.6);
    }
    return col;
  }, [originalColor, complexity, complexityFactor]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += isDir ? 0.005 : (0.01 + activityFactor * 0.08);
      meshRef.current.rotation.z += 0.002;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
    if (coreRef.current && isDir) {
        coreRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
  });

  return (
    <Float speed={2 + activityFactor * 4} rotationIntensity={0.3 + complexityFactor} floatIntensity={0.5} position={position}>
      <group>
        {/* Click Area */}
        <mesh visible={false} onClick={() => { if (!isDir) onClick(); }}>
          <sphereGeometry args={[Math.max(size * 1.5, 8), 8, 8]} />
        </mesh>

        {!isDir && (
            <group>
                <mesh ref={meshRef}>
                  <sphereGeometry args={[size, 64, 64]} />
                  <meshStandardMaterial
                    map={selectedTexture}
                    color={finalColor}
                    metalness={0.1}
                    roughness={0.9}
                    emissive={finalColor}
                    emissiveIntensity={0.05 + activityFactor * 4.0} // Brightness based on Activity
                  />
                </mesh>

                {/* Planetary Ring for high complexity nodes */}
                {complexity > 10 && (
                    <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
                        <torusGeometry args={[size * 1.8, 0.2, 2, 64]} />
                        <meshStandardMaterial 
                            color={finalColor} 
                            transparent 
                            opacity={0.6} 
                            emissive={finalColor}
                            emissiveIntensity={2}
                        />
                    </mesh>
                )}
            </group>
        )}

        {/* Labels moved further out to avoid clipping */}
        <Suspense fallback={null}>
          <Billboard position={[0, size * 1.5 + 4, 0]}>
            <Text
              fontSize={0.9}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#000000"
            >
              {name}
            </Text>
          </Billboard>
        </Suspense>

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
