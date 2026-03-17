import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text, Trail } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store/useStore";

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
  onOpen?: (targetFunction?: string) => void;
}

const vScale = new THREE.Vector3();
const cSatellite = new THREE.Color();

const FunctionSatellite = React.memo(({ name, index, total, planetSize, color, onOpen }: { name: string, index: number, total: number, planetSize: number, color: string, onOpen: (name: string) => void }) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const orbitRadius = planetSize * 2.5 + (index * 1.5);
  const speed = 0.5 + (index * 0.1);
  const offset = (index / total) * Math.PI * 2;

  const setHoveredSatellite = useStore(state => state.setHoveredSatellite);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!hovered) {
        timeRef.current += delta * speed;
    }
    
    const t = timeRef.current + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * orbitRadius;
      ref.current.position.z = Math.sin(t) * orbitRadius;
      ref.current.position.y = Math.sin(t * 0.5) * (planetSize * 0.5);
      
      if (hovered) {
          vScale.set(1.3, 1.3, 1.3);
          ref.current.scale.lerp(vScale, 0.1);
      } else {
          vScale.set(1, 1, 1);
          ref.current.scale.lerp(vScale, 0.1);
      }
    }
  });

  useEffect(() => {
    if (hovered) {
        setHoveredSatellite(name);
    } else {
        setHoveredSatellite(null);
    }
    return () => setHoveredSatellite(null);
  }, [hovered, name, setHoveredSatellite]);

  return (
    <group 
        ref={ref} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { 
            e.stopPropagation(); 
            onOpen(name); 
        }}
    >
      <mesh visible={false}>
        <sphereGeometry args={[planetSize * 0.6, 16, 16]} />
      </mesh>

      <Trail 
        width={1} 
        length={4} 
        color={hovered ? "#ffffff" : color} 
        attenuation={(t) => t * t}
      >
        <mesh>
          <sphereGeometry args={[planetSize * 0.18, 16, 16]} />
          <meshStandardMaterial 
            color={hovered ? "#00ffff" : color} 
            emissive={hovered ? "#00ffff" : color}
            emissiveIntensity={hovered ? 2 : 1.5}
          />
        </mesh>
      </Trail>
      <Suspense fallback={null}>
        <Text
          position={[0, planetSize * 0.5, 0]}
          fontSize={planetSize * (hovered ? 0.35 : 0.25)}
          color={hovered ? "#00ffff" : "white"}
          anchorY="middle"
          maxWidth={10}
          font="/fonts/Inter-Bold.woff"
        >
          {name}
        </Text>
      </Suspense>
    </group>
  );
});

export const Planet = React.memo(({ position, size, color: originalColor, isDir, subElements, isOpened, activity = 0, complexity = 0, isHighlighted = true, textures: propTextures, onClick, onOpen }: PlanetProps) => {
  const { isLowPerformance } = useStore();
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

  const showHeatmap = useStore(state => state.showHeatmap);

  const heatmapColor = useMemo(() => {
    // Green (120) for low complexity, Red (0) for high complexity
    const hue = Math.max(0, 120 - complexity * 6);
    return new THREE.Color(`hsl(${hue}, 80%, 50%)`);
  }, [complexity]);

  const finalColor = useMemo(() => {
    if (showHeatmap) return heatmapColor;
    
    const col = new THREE.Color(originalColor);
    if (complexity > 5) {
        cSatellite.set("#ff3300");
        col.lerp(cSatellite, complexityFactor * 0.6);
    }
    return col;
  }, [originalColor, complexity, complexityFactor, showHeatmap, heatmapColor]);

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
        <mesh 
            visible={false} 
            onClick={(e) => { e.stopPropagation(); if (!isDir) onClick(); }}
            onDoubleClick={(e) => { e.stopPropagation(); if (!isDir && onOpen) onOpen(); }}
            onPointerOver={() => { if(!isDir) document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[Math.max(size * 1.5, 8), 16, 16]} />
        </mesh>

        {!isDir && (
            <group>
                <mesh ref={meshRef}>
                  <sphereGeometry args={[size, isLowPerformance ? 16 : 32, isLowPerformance ? 16 : 32]} />
                  <meshStandardMaterial
                    map={selectedTexture}
                    color={isHighlighted ? finalColor : "#222222"}
                    metalness={0.1}
                    roughness={0.9}
                    transparent={!isHighlighted}
                    opacity={isHighlighted ? 1 : 0.3}
                    emissive={isHighlighted ? finalColor : "#111111"}
                    emissiveIntensity={isHighlighted ? (0.05 + activityFactor * 4.0) : 0.2} 
                  />
                </mesh>

                {complexity > 10 && isHighlighted && (
                    <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
                        <torusGeometry args={[size * 1.8, 0.15, 12, 64]} />
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

        {/* Directory markers removed for cleaner look as requested previously */}

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
                onOpen={(funcName) => onOpen?.(funcName)}
              />
            ))}
          </group>
        )}
      </group>
    </Float>
  );
});
