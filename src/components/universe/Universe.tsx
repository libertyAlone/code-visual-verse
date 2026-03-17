import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Float, Text, Billboard, AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Planet } from "./Planet";
import * as THREE from "three";
import { invoke } from "@tauri-apps/api/core";
import { useStore, ProjectFile } from "../../store/useStore";
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
  onOpen?: (node: ProjectFile, targetFunction?: string) => void;
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
    const { isLowPerformance } = useStore();

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
    const posVector = new THREE.Vector3();

    useFrame((state) => {
        if (scanLineRef.current) {
            // Updated scan range for the larger box
            scanLineRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 8;
        }
        
        if (groupRef.current && planetPos) {
            posVector.set(planetPos[0], planetPos[1], planetPos[2]);
            const dist = camera.position.distanceTo(posVector);
            const scaleFactor = Math.min(Math.max(dist / 300, 1), 4);
            groupRef.current.scale.setScalar(scaleFactor);

            // Tighter offset for cleaner look: radius + margin
            const newOffset = planetSize + (4 * scaleFactor) + 2;
            if (Math.abs(adaptiveOffset - newOffset) > 0.5) {
                setAdaptiveOffset(newOffset);
            }
        }
    });

    if (!planetPos) return null;

    return (
        <group position={[planetPos[0], planetPos[1] + adaptiveOffset, planetPos[2]]} ref={groupRef}>
            {/* Connection beam removed for cleaner appearance */}

            <Billboard>
                {!isLowPerformance && (
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
                    </Float>
                )}
                {isLowPerformance && (
                    <group>
                        <mesh renderOrder={999}>
                            <planeGeometry args={[20, 10]} />
                            <meshBasicMaterial color="#000000" transparent opacity={0.9} />
                        </mesh>
                        <Text position={[-9, 4, 0.1]} fontSize={0.8} color={color} anchorX="left" anchorY="top" maxWidth={18}>
                            {`${path.split(/[/\\]/).pop()}\n---\n${code.substring(0, 100)}...`}
                        </Text>
                    </group>
                )}
                
                {/* HUD Elements */}
                <Text position={[11, -8.5, 0.1]} fontSize={0.4} color={color} anchorX="right" anchorY="bottom" renderOrder={1001}>
                    {t("universe.hologram.status")}
                </Text>
            </Billboard>
        </group>
    );
};

const vTarget = new THREE.Vector3();
const vMid = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vUp = new THREE.Vector3(0, 1, 0);
const qRot = new THREE.Quaternion();

const ConstellationLines = React.memo(({ selectedNode, allNodes, opacity = 1 }: { selectedNode: any, allNodes: any[], opacity?: number }) => {
    const lines = useMemo(() => {
        if (!selectedNode || !selectedNode.imports) return [];
        
        return (selectedNode.imports as string[]).map((imp: string) => {
            const target = allNodes.find(n => {
                const normPath = n.path.replace(/\\/g, '/').toLowerCase();
                const normImp = imp.replace(/\\/g, '/')
                                  .replace(/^@\//, '')
                                  .replace(/^\.\/|^\.\.\//, '')
                                  .toLowerCase();
                
                const isExactMatch = normPath === normImp || 
                                   normPath === normImp + '.ts' || 
                                   normPath === normImp + '.tsx' ||
                                   normPath === normImp + '.js' ||
                                   normPath === normImp + '.jsx';
                
                const isRelativeMatch = normPath.endsWith('/' + normImp) ||
                                       normPath.endsWith('/' + normImp + '.ts') ||
                                       normPath.endsWith('/' + normImp + '.tsx') ||
                                       normPath.endsWith('/' + normImp + '.js') ||
                                       normPath.endsWith('/' + normImp + '.jsx');

                return !n.is_dir && (isExactMatch || isRelativeMatch);
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
                const vStart = new THREE.Vector3(line.start[0], line.start[1], line.start[2]);
                vTarget.set(line.end[0], line.end[1], line.end[2]);
                const distance = vStart.distanceTo(vTarget);
                vMid.addVectors(vStart, vTarget).multiplyScalar(0.5);
                vDir.subVectors(vTarget, vStart).normalize();
                
                if (distance < 0.1) return null;

                qRot.setFromUnitVectors(vUp, vDir);
                const rotation = new THREE.Euler().setFromQuaternion(qRot);

                return (
                    <mesh key={i} position={vMid} rotation={rotation} raycast={() => null}>
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
});

const ManualControls = () => {
    const { camera, gl } = useThree();
    const [keys, setKeys] = useState<Record<string, boolean>>({});
    const speed = 2.5;

    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: true }));
        const handleUp = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.code]: false }));
        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, []);

    useFrame((_, delta) => {
        const d = speed * delta * 60;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

        if (keys['KeyW'] || keys['ArrowUp']) camera.position.addScaledVector(forward, d);
        if (keys['KeyS'] || keys['ArrowDown']) camera.position.addScaledVector(forward, -d);
        if (keys['KeyA'] || keys['ArrowLeft']) camera.position.addScaledVector(right, d);
        if (keys['KeyD'] || keys['ArrowRight']) camera.position.addScaledVector(right, -d);
        if (keys['Space']) camera.position.y += d;
        if (keys['ShiftLeft']) camera.position.y -= d;
    });

    return (
        <OrbitControls 
            makeDefault 
            enablePan={false} 
            enableDamping 
            dampingFactor={0.1}
            rotateSpeed={0.5}
            domElement={gl.domElement}
        />
    );
};

const RadarTracker = () => {
    const { radarZoom } = useStore();
    const range = 2000 / radarZoom;
    const size = 200;

    useFrame((state) => {
        const mark = document.getElementById('radar-player-mark');
        if (mark) {
            const x = ((state.camera.position.x / range) + 0.5) * size - 6;
            const y = ((state.camera.position.z / range) + 0.5) * size - 6;
            mark.style.transform = `translate(${x}px, ${y}px)`;
        }
    });

    return null;
};

const Radar = ({ nodes }: { nodes: any[] }) => {
    const size = 200;
    const { radarZoom, setRadarZoom, setFocusCoord, isMobile } = useStore();
    const range = 2000 / radarZoom;

    const handleRadarClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldX = (x / size - 0.5) * range;
        const worldZ = (y / size - 0.5) * range;
        setFocusCoord([worldX, 0, worldZ]);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        setRadarZoom(Math.min(Math.max(radarZoom - e.deltaY * 0.001, 0.2), 5));
    };

    if (isMobile || nodes.length === 0) return null;

    return (
        <div 
            className="absolute top-10 left-10 w-[200px] h-[200px] rounded-full border border-cyan-500/30 bg-black/40 backdrop-blur-md overflow-hidden group pointer-events-auto cursor-crosshair transition-shadow hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] z-40 shadow-2xl"
            onWheel={handleWheel}
            onClick={handleRadarClick}
        >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500" />
                <div className="absolute inset-0 border border-cyan-500/20 rounded-full scale-75" />
                <div className="absolute inset-0 border border-cyan-500/10 rounded-full scale-50" />
            </div>
            {nodes.filter(n => !n.is_dir).map((node, i) => {
                const x = ((node.position[0] / range) + 0.5) * size;
                const y = ((node.position[2] / range) + 0.5) * size;
                if (x < 0 || x > size || y < 0 || y > size) return null;
                return (
                    <div 
                        key={i} 
                        className="absolute w-1 h-1 rounded-full pointer-events-none"
                        style={{ 
                            left: x, 
                            top: y, 
                            backgroundColor: node.color,
                            opacity: 0.6
                        }}
                    />
                );
            })}
            {/* Player Indicator */}
            <div 
                id="radar-player-mark"
                className="absolute w-3 h-3 border-2 border-white rounded-full flex items-center justify-center pointer-events-none"
                style={{ willChange: 'transform' }}
            >
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] pointer-events-none">
                Radar x{radarZoom.toFixed(1)}
            </div>
        </div>
    );
};

const CameraController = ({ resetTrigger, focusTarget, galaxyNodes, onFocusComplete }: { resetTrigger: number, focusTarget: string | null, galaxyNodes: any[], onFocusComplete: () => void }) => {
    const { camera, controls } = useThree();
    const { focusCoord, setFocusCoord } = useStore();
    const targetPos = useMemo(() => new THREE.Vector3(500, 500, 600), []);
    const initialReset = useRef(resetTrigger);
    const currentTarget = useRef<{ pos: THREE.Vector3, lookAt: THREE.Vector3, completed: boolean } | null>(null);

    useEffect(() => {
        if (focusTarget) {
            const normalizedTarget = focusTarget.replace(/\\/g, '/').toLowerCase();
            const node = galaxyNodes.find(n => n.path.replace(/\\/g, '/').toLowerCase() === normalizedTarget);

            if (node) {
                const nodePos = new THREE.Vector3(...node.position);
                const complexityScale = node.complexity ? Math.min(node.complexity / 2.5, 12) : 0;
                const planetSize = (3 + complexityScale + Math.sqrt(node.size / 200));
                
                // Adaptive distance based on planet size
                const cameraDist = Math.max(planetSize * 3, 30);
                
                currentTarget.current = {
                    pos: nodePos.clone().add(new THREE.Vector3(cameraDist, cameraDist, cameraDist)),
                    lookAt: nodePos.clone(),
                    completed: false
                };
            } else {
                // Fallback: Check if it's a sector/system
                const systemNode = galaxyNodes.find(n => {
                    const normalizedNodePath = n.path.replace(/\\/g, '/').toLowerCase();
                    return n.sector === focusTarget || normalizedNodePath === normalizedTarget || normalizedNodePath.endsWith('/' + normalizedTarget);
                });

                if (systemNode && systemNode.systemPos) {
                  const sysPos = new THREE.Vector3(...systemNode.systemPos);
                  currentTarget.current = {
                      pos: sysPos.clone().add(new THREE.Vector3(120, 120, 120)),
                      lookAt: sysPos.clone(),
                      completed: false
                  };
                }
            }
        } else {
            currentTarget.current = null;
        }
    }, [focusTarget, galaxyNodes]);

    useEffect(() => {
        if (focusCoord) {
            const coordVec = new THREE.Vector3(...focusCoord);
            currentTarget.current = {
                pos: coordVec.clone().add(new THREE.Vector3(150, 150, 150)),
                lookAt: coordVec.clone(),
                completed: false
            };
        }
    }, [focusCoord]);

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
                if (focusCoord) setFocusCoord(null);
                onFocusComplete();
            }
        }
    });

    return null;
};

const PerformanceMonitor = () => {
    const { performanceMode, setIsLowPerformance } = useStore();
    
    useEffect(() => {
        if (performanceMode !== 'auto') {
            setIsLowPerformance(performanceMode === 'low');
            return;
        }

        // Initial Hardware Heuristic
        const cores = navigator.hardwareConcurrency || 4;
        const memory = (navigator as any).deviceMemory || 4;
        if (cores < 4 || memory < 4) {
            setIsLowPerformance(true);
            return;
        }

        // FPS Benchmark
        let frames = 0;
        let start = performance.now();
        let frameId: number;

        const check = () => {
            frames++;
            const now = performance.now();
            if (now - start > 2000) { // Check over 2 seconds
                const fps = (frames * 1000) / (now - start);
                if (fps < 35) setIsLowPerformance(true);
                return;
            }
            frameId = requestAnimationFrame(check);
        };

        frameId = requestAnimationFrame(check);
        return () => cancelAnimationFrame(frameId);
    }, [performanceMode, setIsLowPerformance]);

    return null;
};

export const Universe = ({ nodes, selectedPath, selectedCommitHash, globalCommits, showAllDependencies, onSelect, onOpen, resetCounter = 0, focusTarget = null, onFocusComplete = () => {}, maxDepth, projectPath, onDirectoryColors }: UniverseProps) => {
  const { controlMode, isLowPerformance } = useStore();
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
      const systemScale = 180;
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
      <Canvas 
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1} 
        camera={{ position: [500, 500, 600], fov: 40, far: 10000 }} 
        gl={{ 
          antialias: true,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: "high-performance"
        }}
      >
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <Bvh firstHitOnly>
          <ambientLight intensity={0.5} />
          <pointLight position={[500, 500, 500]} intensity={250000} color="#ffffff" decay={2} />
          <spotLight position={[-800, 1000, 800]} angle={0.3} penumbra={1} intensity={1000000} color="#4488ff" decay={2} />
          <Suspense fallback={null}>
            <Stars radius={600} depth={150} count={isLowPerformance ? 2000 : 5000} factor={8} saturation={1} fade speed={isLowPerformance ? 0.5 : 1.5} />
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
                                <ringGeometry args={[calculatedRadius - 0.2, calculatedRadius + 0.2, isLowPerformance ? 32 : 64]} />
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
                            onOpen={(funcName) => onOpen?.(node, funcName)}
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
          </Bvh>
          <CameraController resetTrigger={resetCounter} focusTarget={focusTarget} galaxyNodes={finalNodes} onFocusComplete={onFocusComplete} />
          {controlMode === 'manual' ? (
              <ManualControls />
          ) : (
              <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.07} maxDistance={3000} minDistance={10} />
          )}
          {!isLowPerformance && (
              <EffectComposer multisampling={0}>
                <Bloom 
                    luminanceThreshold={0.8} 
                    mipmapBlur={true} 
                    intensity={1.5} 
                    radius={0.4} 
                />
              </EffectComposer>
          )}
          <RadarTracker />
          <PerformanceMonitor />
        </Canvas>
        {finalNodes.length > 0 && <Radar nodes={finalNodes} />}
    </div>
  );
};
