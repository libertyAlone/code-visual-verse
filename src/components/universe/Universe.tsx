import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles, Float, Text, Billboard } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Planet } from "./Planet";
import * as THREE from "three";
import { invoke } from "@tauri-apps/api/core";
import { ProjectFile } from "../../store/useStore";
import { useTranslation } from "react-i18next";

interface UniverseProps {
  nodes: ProjectFile[];
  selectedPath: string | null;
  onFocusComplete?: () => void;
  maxDepth: number;
  projectPath: string | null;
  selectedCommitHash: string | null;
  globalCommits: any[];
  showAllDependencies: boolean;
  onSelect: (node: ProjectFile) => void;
  resetCounter?: number;
  focusTarget?: string | null;
  textures?: any; 
  onDirectoryColors?: (colors: { name: string, color: string, path: string }[]) => void;
}

const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

// Holographic Panel for Code HUD with Adaptive Scaling and Anti-Clipping
const HolographicPanel = ({ path, planetPos, planetSize, color }: { path: string, planetPos: [number, number, number], planetSize: number, color: string }) => {
    const { t } = useTranslation();
    const [code, setCode] = useState(t("universe.hologram.init"));
    const scanLineRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useEffect(() => {
        if (!path) return;
        invoke<string>("read_file", { path })
            .then(res => {
                // Reduced line count to ensure it fits the holographic box
                const lines = res.split('\n').slice(0, 12).join('\n');
                setCode(lines || t("universe.hologram.noContent"));
            })
            .catch(() => setCode(t("universe.hologram.protected")));
    }, [path, t]);

    const [adaptiveOffset, setAdaptiveOffset] = useState(25);

    useFrame((state) => {
        if (scanLineRef.current) {
            // Updated scan range for the larger box
            scanLineRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 8;
        }
        
        if (groupRef.current && planetPos) {
            const worldPos = new THREE.Vector3(planetPos[0], planetPos[1], planetPos[2]);
            const dist = camera.position.distanceTo(worldPos);
            const scaleFactor = Math.min(Math.max(dist / 250, 1), 6);
            groupRef.current.scale.setScalar(scaleFactor);

            // Calculate offset to prevent clipping: planet radius + panel height/2 + margin
            // panel height is 16. scaled height is 16 * scaleFactor.
            const newOffset = planetSize + (8 * scaleFactor) + 5;
            setAdaptiveOffset(newOffset);
        }
    });

    if (!planetPos) return null;

    return (
        <group position={[planetPos[0], planetPos[1] + adaptiveOffset, planetPos[2]]} ref={groupRef}>
            {/* Energy Connection Beam */}
            <mesh position={[0, -adaptiveOffset/2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, adaptiveOffset, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
            </mesh>

            <Billboard>
                <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
                    {/* Background Plate - Enlarged for better containment */}
                    <mesh renderOrder={999}>
                        <planeGeometry args={[24, 20]} />
                        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthTest={false} />
                    </mesh>
                    
                    {/* Glass Effect */}
                    <mesh position={[0, 0, -0.05]} renderOrder={998}>
                        <planeGeometry args={[23.8, 19.8]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.85} side={THREE.DoubleSide} />
                    </mesh>

                    {/* Scan Line */}
                    <mesh ref={scanLineRef} position={[0, 0, 0.05]} renderOrder={1000}>
                        <planeGeometry args={[23.6, 0.2]} />
                        <meshBasicMaterial color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthTest={false} />
                    </mesh>

                    {/* Border */}
                    <lineSegments renderOrder={1000}>
                        <edgesGeometry args={[new THREE.PlaneGeometry(24, 20)]} />
                        <lineBasicMaterial color={color} transparent opacity={1} depthTest={false} />
                    </lineSegments>

                    {/* Code Text - Repositioned to stay within bounds */}
                    <Text
                        position={[-11, 8.5, 0.1]}
                        fontSize={0.65}
                        color={color}
                        anchorX="left"
                        anchorY="top"
                        maxWidth={22}
                        lineHeight={1.4}
                        renderOrder={1001}
                    >
                        {`${t("universe.hologram.source")} ${path.split(/[/\\]/).pop()}\n------------------------------\n${code}`}
                    </Text>
                    
                    {/* HUD Elements */}
                    <Text position={[11, -8.5, 0.1]} fontSize={0.4} color={color} anchorX="right" anchorY="bottom" renderOrder={1001}>
                        {t("universe.hologram.status")}
                    </Text>
                </Float>
            </Billboard>
        </group>
    );
};

const ConstellationLines = ({ selectedNode, allNodes, opacity = 1 }: { selectedNode: any, allNodes: any[], opacity?: number }) => {
    const lines = useMemo(() => {
        if (!selectedNode || !selectedNode.imports) return [];
        
        return (selectedNode.imports as string[]).map((imp: string) => {
            const target = allNodes.find(n => {
                const normPath = n.path.replace(/\\/g, '/').toLowerCase();
                const normImp = imp.replace(/\\/g, '/')
                                  .replace(/^@\//, '')
                                  .replace(/^\.\/|^\.\.\//, '')
                                  .toLowerCase();
                return normPath.endsWith(normImp) || 
                       normPath.endsWith(normImp + '.ts') || 
                       normPath.endsWith(normImp + '.tsx') ||
                       normPath.endsWith(normImp + '.js') ||
                       normPath.endsWith(normImp + '.jsx') ||
                       normPath.includes('/' + normImp + '/');
            });
            
            if (target && (target as any).position) {
                return { 
                    start: selectedNode.position, 
                    end: (target as any).position,
                    color: (target as any).color || "#00ffff"
                };
            }
            return null;
        }).filter(Boolean);
    }, [selectedNode, allNodes]);

    return (
        <group>
            {lines.map((line: any, i: number) => {
                const vStart = new THREE.Vector3(...line.start);
                const vEnd = new THREE.Vector3(...line.end);
                const distance = vStart.distanceTo(vEnd);
                const midpoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
                const direction = new THREE.Vector3().subVectors(vEnd, vStart).normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
                const rotation = new THREE.Euler().setFromQuaternion(quaternion);

                return (
                    <mesh key={i} position={midpoint} rotation={rotation} raycast={() => null}>
                        <cylinderGeometry args={[0.08, 0.08, distance, 6]} />
                        <meshBasicMaterial 
                            color={line.color} 
                            transparent 
                            opacity={0.3 * opacity} 
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

const CameraController = ({ resetTrigger, focusTarget, galaxyNodes, onFocusComplete }: { resetTrigger: number, focusTarget: string | null, galaxyNodes: any[], onFocusComplete: () => void }) => {
    const { camera, controls } = useThree();
    const targetPos = useMemo(() => new THREE.Vector3(500, 500, 600), []);
    const initialReset = useRef(resetTrigger);
    const currentTarget = useRef<{ pos: THREE.Vector3, lookAt: THREE.Vector3, completed: boolean } | null>(null);

    useEffect(() => {
        if (focusTarget) {
            const normalizedTarget = focusTarget.replace(/\\/g, '/');
            const node = galaxyNodes.find(n => n.path.replace(/\\/g, '/') === normalizedTarget);

            if (node) {
                const nodePos = new THREE.Vector3(...node.position);
                currentTarget.current = {
                    pos: nodePos.clone().add(new THREE.Vector3(50, 50, 50)),
                    lookAt: nodePos.clone(),
                    completed: false
                };
            } else {
                const systemNode = galaxyNodes.find(n => {
                    const normalizedNodePath = n.path.replace(/\\/g, '/');
                    return n.sector === focusTarget || normalizedNodePath === normalizedTarget || normalizedNodePath.endsWith('/' + normalizedTarget);
                });

                if (systemNode && systemNode.systemPos) {
                  const sysPos = new THREE.Vector3(...systemNode.systemPos);
                  currentTarget.current = {
                      pos: sysPos.clone().add(new THREE.Vector3(200, 200, 200)),
                      lookAt: sysPos.clone(),
                      completed: false
                  };
                }
            }
        } else {
            currentTarget.current = null;
        }
    }, [focusTarget, galaxyNodes]);

    useFrame(() => {
        if (resetTrigger !== initialReset.current) {
            camera.position.lerp(targetPos, 0.05);
            if (controls) {
              (controls as any).target.lerp(new THREE.Vector3(0,0,0), 0.05);
              (controls as any).update();
            }
            if (camera.position.distanceTo(targetPos) < 1) initialReset.current = resetTrigger;
        }

        if (currentTarget.current) {
            camera.position.lerp(currentTarget.current.pos, 0.04);
            if (controls) {
                (controls as any).target.lerp(currentTarget.current.lookAt, 0.04);
                (controls as any).update();
            }
            if (!currentTarget.current.completed && camera.position.distanceTo(currentTarget.current.pos) < 1) {
                currentTarget.current.completed = true;
                onFocusComplete();
            }
        }
    });

    return null;
};

export const Universe = ({ nodes, selectedPath, selectedCommitHash, globalCommits, showAllDependencies, onSelect, resetCounter = 0, focusTarget = null, onFocusComplete = () => {}, maxDepth, projectPath, onDirectoryColors }: UniverseProps) => {
  const texturesResource = useLoader(THREE.TextureLoader, [
    '/textures/rocky.png', '/textures/gas_giant.png', '/textures/atmospheric.png', '/textures/continental.png'
  ]);

  const textureMap = useMemo(() => {
    const [rocky, gas, atmo, cont] = texturesResource;
    [rocky, gas, atmo, cont].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 1);
    });
    return { rocky, gas, atmo, cont };
  }, [texturesResource]);

  const controlsRef = useRef<any>(null);
  const timelineTimestamp = useMemo(() => {
    const selectedCommit = globalCommits.find((c: any) => c.hash === selectedCommitHash);
    return selectedCommit ? parseInt(selectedCommit.date) : Infinity;
  }, [selectedCommitHash, globalCommits]);

  const [commitFiles, setCommitFiles] = useState<string[]>([]);
  useEffect(() => {
    if (selectedCommitHash && projectPath) {
        invoke<string[]>("get_commit_files", { path: projectPath, hash: selectedCommitHash })
            .then(res => setCommitFiles(res))
            .catch(() => setCommitFiles([]));
    } else setCommitFiles([]);
  }, [selectedCommitHash, projectPath]);

  useEffect(() => {
    if (controlsRef.current && resetCounter > 0) controlsRef.current.reset();
  }, [resetCounter]);

  const colorPalette = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff4444", "#4444ff", "#ff8800", "#0088ff"];
  const hashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const norm = (p: string) => (p || '').replace(/\\/g, '/').toLowerCase();

  const getDirColor = (path: string) => {
    if (!projectPath) return hashColor('root');
    const nRoot = norm(projectPath);
    const nPath = norm(path);
    if (nPath.startsWith(nRoot)) {
        const relPath = nPath.substring(nRoot.length).replace(/^[/\\]+/, '');
        const relParts = relPath.split('/').filter(Boolean);
        const coloringKey = relParts.slice(0, maxDepth).join('/') || 'root';
        return hashColor(coloringKey);
    }
    return hashColor('root');
  };

  const nodeBirthTimeMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach(node => { if (!node.is_dir) map.set(norm(node.path), node.birthTime || 0); });
    const sortedNodes = [...nodes].sort((a, b) => b.path.split(/[/\\]/).length - a.path.split(/[/\\]/).length);
    sortedNodes.forEach(node => {
        const nPath = norm(node.path);
        const bTime = map.get(nPath) || 0;
        if (bTime > 0) {
            let parent = nPath.substring(0, nPath.lastIndexOf('/'));
            while (parent && parent.includes('/')) {
                const current = map.get(parent) || Infinity;
                if (bTime < current) map.set(parent, bTime);
                parent = parent.substring(0, parent.lastIndexOf('/'));
            }
            if (parent) {
                const current = map.get(parent) || Infinity;
                if (bTime < current) map.set(parent, bTime);
            }
        }
    });
    return map;
  }, [nodes]);

  const processedData = useMemo(() => {
    if (!nodes || nodes.length === 0) return { finalNodes: [], displayColors: [] };
    const dirGroups: Record<string, ProjectFile[]> = {};
    nodes.forEach(node => {
      if (!node || !node.path) return; 
      const normParent = norm(node.path).split('/').slice(0, -1).join('/') || 'root';
      if (!dirGroups[normParent]) dirGroups[normParent] = [];
      dirGroups[normParent].push(node);
    });

    const parents = Object.keys(dirGroups).sort(); 
    const finalNodesResult: any[] = [];
    const systemCentersMap = new Map<string, [number, number, number]>();

    parents.forEach((parent, systemIndex) => {
      const systemScale = 140;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const systemRadius = Math.sqrt(systemIndex) * systemScale + 80;
      const systemAngle = systemIndex * goldenAngle;
      const systemX = Math.cos(systemAngle) * systemRadius;
      const systemZ = Math.sin(systemAngle) * systemRadius;
      const systemY = (seededRandom(parent) - 0.5) * 120;
      systemCentersMap.set(parent, [systemX, systemY, systemZ]);

      let currentOrbitRadius = 40;
      dirGroups[parent].sort((a, b) => a.name.localeCompare(b.name)).forEach((node, planetIndex) => {
        const nodeComplexityScale = node.complexity ? Math.min(node.complexity / 2.5, 12) : 0;
        const nodeFinalSize = 3 + nodeComplexityScale + Math.sqrt(node.size / 200);
        const planetAngle = (planetIndex / dirGroups[parent].length) * Math.PI * 2;
        if (!node.is_dir) currentOrbitRadius += nodeFinalSize + 15; 
        
        const dirRadius = seededRandom(node.path + "rad") * 10;
        const phi = seededRandom(node.path + "phi") * Math.PI * 2;
        const theta = seededRandom(node.path + "theta") * Math.PI;
        const orbitRadius = node.is_dir ? dirRadius : currentOrbitRadius;
        
        let x, y, z;
        if (node.is_dir) {
            x = systemX + Math.cos(phi) * Math.sin(theta) * orbitRadius;
            z = systemZ + Math.sin(phi) * Math.sin(theta) * orbitRadius;
            y = systemY + Math.cos(theta) * orbitRadius;
        } else {
            x = systemX + Math.cos(planetAngle) * orbitRadius;
            z = systemZ + Math.sin(planetAngle) * orbitRadius;
            y = systemY + (seededRandom(node.path) - 0.5) * 30;
        }

        let cleanSector = 'root';
        if (projectPath) {
          const nRoot = norm(projectPath);
          const nNodePath = norm(node.path);
          if (nNodePath.startsWith(nRoot)) {
            const relPath = nNodePath.substring(nRoot.length).replace(/^[/\\]+/, '');
            const sectorParts = relPath.split('/').filter(Boolean).slice(0, Math.max(1, maxDepth));
            cleanSector = sectorParts.join('/') || 'root';
            if (cleanSector.startsWith('src/')) cleanSector = cleanSector.substring(4);
            if (cleanSector === '') cleanSector = 'ROOT';
          }
        }
        const nPath = norm(node.path);
        finalNodesResult.push({
          ...node,
          position: [x, y, z] as [number, number, number],
          color: getDirColor(node.path),
          systemPos: [systemX, systemY, systemZ],
          parentPath: nPath.substring(0, nPath.lastIndexOf('/')) || 'root',
          normalizedPath: nPath
        });
      });
    });

    const displayColorsMap = new Map();
    parents.forEach(p => {
        if (!projectPath) return;
        const nRoot = norm(projectPath);
        let relP = norm(p).startsWith(nRoot) ? norm(p).substring(nRoot.length).replace(/^[/\\]+/, '') : '';
        const sectorParts = relP.split('/').filter(Boolean).slice(0, Math.max(1, maxDepth));
        const sectorPath = sectorParts.join('/') || 'root';
        let displayName = sectorPath.startsWith('src/') ? sectorPath.substring(4) : (sectorPath === 'root' ? 'ROOT' : sectorPath);
        if (!displayColorsMap.has(displayName)) displayColorsMap.set(displayName, { name: displayName, color: hashColor(sectorPath), path: p });
    });

    return { 
        finalNodes: finalNodesResult, 
        displayColors: Array.from(displayColorsMap.values()).slice(0, 30),
        systemCenters: systemCentersMap
    };
  }, [nodes, maxDepth, projectPath]);

  const finalNodes = processedData?.finalNodes || [];
  const displayColors = processedData?.displayColors || [];
  const systemCenters = processedData?.systemCenters || new Map();

  const visibleNodes = useMemo(() => {
    return finalNodes.filter(node => {
      if (!selectedCommitHash) return true;
      const bTime = nodeBirthTimeMap.get(node.normalizedPath) || 0;
      return bTime > 0 && bTime <= timelineTimestamp;
    });
  }, [finalNodes, selectedCommitHash, timelineTimestamp, nodeBirthTimeMap]);
  
  const selectedNodeObj = useMemo(() => {
    const normSel = selectedPath ? norm(selectedPath) : null;
    return visibleNodes.find(n => n.normalizedPath === normSel);
  }, [visibleNodes, selectedPath]);

  useEffect(() => {
    if (onDirectoryColors && displayColors.length > 0) onDirectoryColors(displayColors);
  }, [displayColors, onDirectoryColors]);

  return (
    <div className="w-full h-full bg-[#010103] relative">
      <Canvas dpr={[1, 2]} camera={{ position: [500, 500, 600], fov: 40, far: 10000 }} gl={{ antialias: false }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[300, 300, 300]} intensity={20} color="#ffffff" />
          <spotLight position={[-200, 500, 200]} angle={0.4} penumbra={1} intensity={60} color="#4488ff" />
          <Suspense fallback={null}>
            <Stars radius={600} depth={150} count={10000} factor={8} saturation={1} fade speed={2} />
            <Sparkles count={500} scale={1000} size={3} speed={0.4} opacity={0.5} color="#ffffff" />
          </Suspense>
          <Suspense fallback={null}>
            <group>
                {Array.from(systemCenters.entries()).map(([parentPath, center], i) => {
                    const visibleChildren = visibleNodes.filter(child => child.parentPath === parentPath);
                    if (visibleChildren.length === 0) return null;
                    const hasVisibleFiles = visibleChildren.some(c => !c.is_dir);
                    if (!hasVisibleFiles) return null;

                    const calculatedRadius = Math.max(...visibleChildren.map(f => {
                        const dx = f.position[0] - center[0], dy = f.position[1] - center[1], dz = f.position[2] - center[2];
                        return Math.sqrt(dx*dx + dy*dy + dz*dz);
                    }), 0) + 15;
                    
                    return (
                        <group key={`${parentPath}-${i}-system`}>
                            <mesh rotation-x={Math.PI / 2} position={center}>
                                <ringGeometry args={[calculatedRadius - 0.2, calculatedRadius + 0.2, 64]} />
                                <meshBasicMaterial color={getDirColor(parentPath)} transparent opacity={0.05} />
                            </mesh>
                        </group>
                    );
                })}

                {visibleNodes.map((node, i) => {
                    const complexityScale = node.complexity ? Math.min(node.complexity / 2.5, 12) : 0;
                    const finalSize = node.is_dir ? 0.6 : (3 + complexityScale + Math.sqrt(node.size / 200));
                    const isCommitHighlighted = selectedCommitHash 
                        ? commitFiles.some(cf => node.normalizedPath.endsWith(norm(cf)))
                        : true;

                    return (
                        <Planet
                            key={`${node.path}-${i}`}
                            position={node.position}
                            size={finalSize}
                            color={node.color}
                            sector={node.sector}
                            isDir={node.is_dir}
                            isOpened={selectedPath === node.path}
                            isHighlighted={isCommitHighlighted}
                            subElements={node.functions?.map((f: string) => ({ name: f }))}
                            activity={node.commit_count}
                            complexity={node.complexity}
                            textures={textureMap}
                            onClick={() => onSelect(node)}
                        />
                    );
                })}
                
                {selectedNodeObj && !selectedNodeObj.is_dir && selectedNodeObj.position && (
                    <HolographicPanel 
                        path={selectedNodeObj.path} 
                        planetPos={selectedNodeObj.position}
                        planetSize={selectedNodeObj.complexity ? Math.min(selectedNodeObj.complexity / 2.5, 12) + 3 + Math.sqrt(selectedNodeObj.size / 200) : 3}
                        color={selectedNodeObj.color}
                    />
                )}

                {selectedNodeObj && (
                    <ConstellationLines selectedNode={selectedNodeObj} allNodes={visibleNodes} opacity={1} />
                )}
                {showAllDependencies && visibleNodes.filter(n => !n.is_dir && n.path !== selectedPath).map((node, i) => (
                    <ConstellationLines key={`all-dep-${i}`} selectedNode={node} allNodes={visibleNodes} opacity={0.3} />
                ))}
            </group>
          </Suspense>
          <CameraController resetTrigger={resetCounter} focusTarget={focusTarget} galaxyNodes={finalNodes} onFocusComplete={onFocusComplete} />
          <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.07} maxDistance={3000} minDistance={40} />
          <EffectComposer multisampling={1}>
            <Bloom luminanceThreshold={1.0} mipmapBlur={true} intensity={1.2} radius={0.3} />
          </EffectComposer>
      </Canvas>
    </div>
  );
};
