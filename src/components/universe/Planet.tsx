import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text, Trail } from "@react-three/drei";
import * as THREE from "three";

interface SubElement {
  name: string;
}

interface PlanetProps {
  position: [number, number, number];
  size: number;
  color: string;
  sector?: string;
  isDir: boolean;
  subElements?: SubElement[];
  isOpened?: boolean;
  activity?: number;
  complexity?: number;
  isHighlighted?: boolean;
  textures?: any;
  onClick: () => void;
}

const FunctionSatellite = ({ name, index, total, planetSize, color, onClick }: { name: string, index: number, total: number, planetSize: number, color: string, onClick: () => void }) => {
  const ref = useRef<THREE.Group>(null);
  
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

export const Planet = ({ position, size, color: originalColor, isDir, subElements, isOpened, activity = 0, complexity = 0, isHighlighted = true, textures: propTextures, onClick }: PlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const complexityFactor = Math.min(complexity / 20, 1);
  const activityFactor = Math.min(activity / 100, 1);
  
  const selectedTexture = useMemo(() => {
    if (!propTextures) return null;
    if (complexity > 30) return propTextures.gas;
    if (size > 20) return propTextures.cont;
    if (subElements && subElements.length > 10) return propTextures.atmo;
    return propTextures.rocky;
  }, [complexity, size, subElements, propTextures]);

  const finalColor = useMemo(() => {
    const col = new THREE.Color(originalColor);
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
        <mesh visible={false} onClick={() => { if (!isDir) onClick(); }}>
          <sphereGeometry args={[Math.max(size * 1.5, 8), 8, 8]} />
        </mesh>

        {!isDir && (
            <group>
                <mesh ref={meshRef}>
                  <sphereGeometry args={[size, 64, 64]} />
                  <meshStandardMaterial
                    map={selectedTexture}
                    color={isHighlighted ? finalColor : new THREE.Color("#222222")}
                    metalness={0.1}
                    roughness={0.9}
                    transparent={!isHighlighted}
                    opacity={isHighlighted ? 1 : 0.3}
                    emissive={isHighlighted ? finalColor : new THREE.Color("#111111")}
                    emissiveIntensity={isHighlighted ? (0.05 + activityFactor * 4.0) : 0.2} 
                  />
                </mesh>

                {complexity > 10 && isHighlighted && (
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

        {isDir && (
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial color={originalColor} transparent opacity={0.4} />
            </mesh>
        )}

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
