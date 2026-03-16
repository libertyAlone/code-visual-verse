import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles, Points, PointMaterial, Float, Text as DreiText } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Planet } from "./Planet";
import * as THREE from "three";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { ProjectFile } from "../../store/useStore";
import { DependencyNebula } from "./UniverseHelpers";

interface UniverseProps {
  nodes: ProjectFile[];
  selectedPath: string | null;
  onSelect: (node: ProjectFile) => void;
  resetCounter?: number;
  focusTarget?: string | null;
  onFocusComplete?: () => void;
  maxDepth: number;
  projectPath: string | null;
  onDirectoryColors?: (colors: { name: string, color: string, path: string }[]) => void;
}

// Stable pseudo-random based on string seed
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};


const GravityLink = ({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) => {
    const line = useMemo(() => {
        const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color, 
            transparent: true, 
            opacity: 0.1, 
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        return new THREE.Line(geometry, material);
    }, [start, end, color]);

    return <primitive object={line} raycast={() => null} />;
};

const DirectorySector = ({ position, radius, color, childrenPositions, onClick }: { 
    position: [number, number, number], 
    radius: number, 
    color: string,
    childrenPositions: [number, number, number][],
    onClick?: () => void
}) => {
    const sphereRef = useRef<THREE.Points>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (sphereRef.current) {
            sphereRef.current.rotation.y += 0.001;
            const pulse = 1 + Math.sin(time * 1.5) * 0.02;
            sphereRef.current.scale.setScalar(pulse);
        }
        if (ringRef.current) {
            ringRef.current.rotation.z -= 0.005;
        }
    });

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            {/* Holographic Force Field Points */}
            <Points ref={sphereRef as any} raycast={() => null}>
                <sphereGeometry args={[radius, 32, 32]} />
                <PointMaterial 
                    color={color} 
                    transparent 
                    opacity={0.08} 
                    size={0.15}
                    sizeAttenuation={true}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </Points>

            {/* Core Glow Dot - Now clickable */}
            <mesh>
                <sphereGeometry args={[2, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            
            {/* Gravity Connections to children */}
            {childrenPositions.map((childPos, i) => (
                <GravityLink 
                    key={i} 
                    start={[0, 0, 0]} 
                    end={[childPos[0] - position[0], childPos[1] - position[1], childPos[2] - position[2]]} 
                    color={color} 
                />
            ))}
        </group>
    );
};

const FloatingReadme = ({ path, position, color }: { path: string, position: [number, number, number], color: string }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState(t("universe.readmeWait"));

    useEffect(() => {
        invoke("read_file", { path: path + (path.endsWith('/') || path.endsWith('\\') ? "" : "/") + "README.md" })
            .then((res: any) => setContent(res))
            .catch(() => setContent(t("universe.noReadme")));
    }, [path, t]);

    return (
        <group position={position}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Holographic Panel */}
                <mesh>
                    <planeGeometry args={[25, 35]} />
                    <meshBasicMaterial 
                        color={color} 
                        transparent 
                        opacity={0.1} 
                        side={THREE.DoubleSide} 
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                    <planeGeometry args={[24, 34]} />
                    <meshBasicMaterial 
                        color="#000000" 
                        transparent 
                        opacity={0.4} 
                        side={THREE.DoubleSide} 
                    />
                </mesh>
                
                {/* Boarder */}
                <lineSegments>
                    <edgesGeometry args={[new THREE.PlaneGeometry(25, 35)]} />
                    <lineBasicMaterial color={color} transparent opacity={0.6} />
                </lineSegments>

                <Suspense fallback={null}>
                    <group position={[0, 14, 0.2]}>
                        <DreiText
                            fontSize={1.2}
                            color={color}
                            anchorX="center"
                            fontWeight="bold"
                            maxWidth={20}
                        >
                            {t("universe.readmeTitle")}
                        </DreiText>
                        <DreiText
                            position={[0, -4, 0]}
                            fontSize={0.8}
                            color="white"
                            anchorX="center"
                            maxWidth={20}
                            lineHeight={1.4}
                        >
                            {content.length > 300 ? content.substring(0, 300) + "..." : content}
                        </DreiText>
                    </group>
                </Suspense>
            </Float>

            {/* Link to center */}
            <mesh raycast={() => null}>
                <cylinderGeometry args={[0.02, 0.02, 10]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

const CameraController = ({ resetTrigger, focusTarget, galaxyNodes, onFocusComplete }: { resetTrigger: number, focusTarget: string | null, galaxyNodes: any[], onFocusComplete: () => void }) => {
    const { camera, controls } = useThree();
    const targetPos = useMemo(() => new THREE.Vector3(500, 500, 600), []);
    const initialReset = useRef(resetTrigger);
    
    // Maintain a local target state for smoothing
    const currentTarget = useRef<{ pos: THREE.Vector3, lookAt: THREE.Vector3 } | null>(null);

    useEffect(() => {
        if (focusTarget) {
            // Find target pos - could be a specific node or a directory (galaxy system center)
            const node = galaxyNodes.find(n => n.path === focusTarget);
            if (node) {
                const nodePos = new THREE.Vector3(...node.position);
                currentTarget.current = {
                    pos: nodePos.clone().add(new THREE.Vector3(50, 50, 50)),
                    lookAt: nodePos.clone()
                };
            } else {
                // Try to find if this path is a sector/directory name in the legend
                // We find the first node that belongs to this sector to get the system center
                const systemNode = galaxyNodes.find(n => n.sector === focusTarget || n.path.startsWith(focusTarget + '/'));
                if (systemNode && systemNode.systemPos) {
                  const sysPos = new THREE.Vector3(...systemNode.systemPos);
                  currentTarget.current = {
                      pos: sysPos.clone().add(new THREE.Vector3(150, 150, 150)),
                      lookAt: sysPos.clone()
                  };
                }
            }
        } else {
            currentTarget.current = null;
        }
    }, [focusTarget, galaxyNodes]);

    useFrame(() => {
        if (resetTrigger !== initialReset.current) {
            camera.position.lerp(targetPos, 0.05); // Slower reset
            if (controls) {
              (controls as any).target.lerp(new THREE.Vector3(0,0,0), 0.05);
              (controls as any).update();
            }
            if (camera.position.distanceTo(targetPos) < 1) {
                initialReset.current = resetTrigger;
            }
        }

        if (currentTarget.current) {
            camera.position.lerp(currentTarget.current.pos, 0.04); // Even slower for tour feel
            if (controls) {
                (controls as any).target.lerp(currentTarget.current.lookAt, 0.04);
                (controls as any).update();
            }
            
            if (camera.position.distanceTo(currentTarget.current.pos) < 1) {
                onFocusComplete();
            }
        }
    });

    return null;
};

export const Universe = ({ nodes, selectedPath, onSelect, resetCounter = 0, focusTarget = null, onFocusComplete = () => {}, maxDepth, projectPath, onDirectoryColors }: UniverseProps) => {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current && resetCounter > 0) {
        controlsRef.current.reset();
    }
  }, [resetCounter]);

  const colorPalette = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff4444", "#4444ff", "#ff8800", "#0088ff"];

  const hashColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colorPalette.length;
        return colorPalette[colorIndex];
    };

    const getDirColor = (path: string) => {
        if (!projectPath) return hashColor('root');
        
        const normalizedRoot = projectPath.replace(/\\/g, '/');
        const normalizedPath = path.replace(/\\/g, '/');
        
        if (normalizedPath.startsWith(normalizedRoot)) {
            const relPath = normalizedPath.substring(normalizedRoot.length).replace(/^\/|^\\/, '');
            const relParts = relPath.split('/').filter(Boolean);
            const coloringKey = relParts.slice(0, maxDepth).join('/') || 'root';
            return hashColor(coloringKey);
        }
        
        return hashColor('root');
    };

  const processedData = useMemo(() => {
    // Guard against empty or invalid nodes
    if (!nodes || nodes.length === 0) {
      return { finalNodes: [], displayColors: [] };
    }

    const dirGroups: Record<string, ProjectFile[]> = {};
    nodes.forEach(node => {
      if (!node || !node.path) return; // Skip invalid nodes
      const parts = node.path.split(/[\\/]/);
      const parent = parts.slice(0, -1).join('/') || 'root';
      if (!dirGroups[parent]) dirGroups[parent] = [];
      dirGroups[parent].push(node);
    });

    const parents = Object.keys(dirGroups).sort(); // Sort for stable layout
    const finalNodes: any[] = [];

    parents.forEach((parent, systemIndex) => {
      const systemScale = 140;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const systemRadius = Math.sqrt(systemIndex) * systemScale + 80;
      const systemAngle = systemIndex * goldenAngle;

      const systemX = Math.cos(systemAngle) * systemRadius;
      const systemZ = Math.sin(systemAngle) * systemRadius;

      const systemSeed = seededRandom(parent);
      const systemY = (systemSeed - 0.5) * 120;

      dirGroups[parent].sort((a, b) => a.name.localeCompare(b.name)).forEach((node, planetIndex) => {
        const planetAngle = (planetIndex / dirGroups[parent].length) * Math.PI * 2;
        const orbitRadius = node.is_dir ? 0 : 35 + planetIndex * 5;

        const x = systemX + Math.cos(planetAngle) * orbitRadius;
        const z = systemZ + Math.sin(planetAngle) * orbitRadius;
        const nodeSeed = seededRandom(node.path);
        const y = systemY + (nodeSeed - 0.5) * 20;

        const color = getDirColor(node.path);

        let cleanSector = 'root';
        if (projectPath) {
          const normalizedRoot = projectPath.replace(/\\/g, '/');
          const normalizedPath = node.path.replace(/\\/g, '/');
          if (normalizedPath.startsWith(normalizedRoot)) {
            const relPath = normalizedPath.substring(normalizedRoot.length).replace(/^\/|^\\/, '');
            const relParts = relPath.split('/').filter(Boolean);
            const sectorParts = relParts.slice(0, maxDepth);
            cleanSector = sectorParts.join('/') || 'root';
            if (cleanSector.startsWith('src/')) cleanSector = cleanSector.substring(4);
            if (cleanSector === '') cleanSector = 'ROOT';
          }
        }

        finalNodes.push({
          ...node,
          position: [x, y, z] as [number, number, number],
          color: color,
          sector: cleanSector === 'root' ? 'ROOT' : cleanSector,
          size: node.size,
          systemPos: [systemX, systemY, systemZ]
        });
      });
    });

    const clusterEntries = parents.map(p => {
        if (!projectPath) return { name: 'ROOT', color: hashColor('root'), path: 'root' };
        const normalizedRoot = projectPath.replace(/\\/g, '/');
        const normalizedP = p.replace(/\\/g, '/');
        let relativeP = '';
        if (normalizedP.startsWith(normalizedRoot)) {
            relativeP = normalizedP.substring(normalizedRoot.length).replace(/^\/|^\\/, '');
        }
        const relParts = relativeP.split('/').filter(Boolean);
        const sectorParts = relParts.slice(0, maxDepth);
        const sectorPath = sectorParts.join('/') || 'root';
        let displayName = sectorPath;
        if (displayName.startsWith('src/')) displayName = displayName.substring(4);
        displayName = displayName === '' || sectorPath === 'root' ? 'ROOT' : displayName;
        return { name: displayName, color: hashColor(sectorPath), path: p };
    });
    
    const displayColorsMap = new Map();
    clusterEntries.forEach(item => {
        if (item.name !== 'ROOT' && !displayColorsMap.has(item.name)) {
            displayColorsMap.set(item.name, item);
        }
    });

    return { 
        finalNodes: finalNodes || [], 
        displayColors: Array.from(displayColorsMap.values()).slice(0, 30) 
    };
  }, [nodes, maxDepth, projectPath]);

  const finalNodes = processedData?.finalNodes || [];
  const displayColors = processedData?.displayColors || [];

  useEffect(() => {
    if (onDirectoryColors && displayColors.length > 0) {
        onDirectoryColors(displayColors);
    }
  }, [displayColors, onDirectoryColors]);

  return (
    <div className="w-full h-full bg-[#010103] relative">
      <Canvas dpr={[1, 2.5]} camera={{ position: [500, 500, 600], fov: 40, far: 10000 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[300, 300, 300]} intensity={4} color="#ffffff" />
          <spotLight position={[-200, 500, 200]} angle={0.4} penumbra={1} intensity={25} color="#4488ff" />
          
          <Suspense fallback={null}>
            <Stars radius={600} depth={150} count={10000} factor={8} saturation={1} fade speed={2} />
            <Sparkles count={500} scale={1000} size={3} speed={0.4} opacity={0.5} color="#ffffff" />
          </Suspense>
          
          <group>
            {/* Render Directories as Holographic Sectors */}
            {finalNodes.filter((n: any) => n.is_dir).map((node: any, i: number) => {
                const systemFiles = finalNodes.filter((f: any) => {
                    const parts = f.path.split(/[\\/]/);
                    const parent = parts.slice(0, -1).join('/') || 'root';
                    return (parent === node.path || (node.path === 'root' && parent === 'root')) && !f.is_dir;
                });

                const radius = systemFiles.length > 0 
                    ? Math.max(...systemFiles.map((f: any) => {
                        const dx = f.position[0] - node.position[0];
                        const dy = f.position[1] - node.position[1];
                        const dz = f.position[2] - node.position[2];
                        return Math.sqrt(dx*dx + dy*dy + dz*dz);
                    })) + 15
                    : 30;

                return (
                    <group key={`sector-grp-${node.path}-${i}`}>
                        <DirectorySector 
                            position={node.position}
                            radius={radius}
                            color={getDirColor(node.path)}
                            childrenPositions={systemFiles.map((f: any) => f.position)}
                            onClick={() => onSelect(node)}
                        />
                        {node.has_readme && (
                            <FloatingReadme 
                                path={node.path}
                                position={[node.position[0] - radius * 0.5, node.position[1] + radius * 0.8, node.position[2]]}
                                color={getDirColor(node.path)}
                            />
                        )}
                    </group>
                );
            })}

            {/* Render Files as Planets */}
            {finalNodes.filter((n: any) => !n.is_dir).map((node: any, i: number) => {
               const complexityScale = node.complexity ? Math.min(node.complexity / 2.5, 12) : 0;
               const finalSize = 3 + complexityScale + Math.sqrt(node.size / 200);

               return (
                <Planet
                    key={`${node.path}-${i}`}
                    name={node.name}
                    position={node.position}
                    size={finalSize}
                    color={node.color}
                    sector={node.sector}
                    isDir={node.is_dir}
                    isOpened={selectedPath === node.path}
                    subElements={node.functions?.map((f: string) => ({ name: f }))}
                    activity={node.commit_count}
                    complexity={node.complexity}
                    onClick={() => onSelect(node)}
                />
               );
            })}
          </group>

          <DependencyNebula galaxyNodes={finalNodes} />

          <CameraController 
            resetTrigger={resetCounter} 
            focusTarget={focusTarget} 
            galaxyNodes={finalNodes}
            onFocusComplete={onFocusComplete}
          />

          <OrbitControls 
            ref={controlsRef}
            makeDefault 
            enableDamping 
            dampingFactor={0.07}
            maxDistance={3000}
            minDistance={40}
          />
          
          <EffectComposer multisampling={8}>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} radius={0.4} />
          </EffectComposer>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Internal Universe HUD elements can go here if needed */}
      </div>
    </div>
  );
};
