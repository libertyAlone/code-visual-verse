import { useMemo } from "react";
import * as THREE from "three";

export const EnergyBeam = ({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) => {
    const curve = useMemo(() => {
        const v1 = new THREE.Vector3(...start);
        const v2 = new THREE.Vector3(...end);
        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        mid.y += v1.distanceTo(v2) * 0.25; 
        return new THREE.QuadraticBezierCurve3(v1, mid, v2);
    }, [start, end]);

    return (
        <mesh raycast={() => null}>
            <tubeGeometry args={[curve, 32, 0.08, 8, false]} />
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.3} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </mesh>
    );
};

export const DependencyNebula = ({ galaxyNodes }: { galaxyNodes: any[] }) => {
    const connections = useMemo(() => {
        const res: any[] = [];
        const nodeMap = new Map();
        galaxyNodes.forEach(n => {
            const simpleName = n.name.split('.')[0];
            nodeMap.set(simpleName, n);
            nodeMap.set(n.path, n);
        });

        galaxyNodes.forEach(node => {
            if (node.imports && !node.is_dir) {
                node.imports.forEach((imp: string) => {
                    const impName = imp.split(/[\\/]/).pop()?.split('.')[0];
                    const target = nodeMap.get(impName);
                    
                    if (target && target.path !== node.path && !target.is_dir) {
                        res.push({
                            start: node.position,
                            end: target.position,
                            color: node.color,
                            id: `conn-${node.path}-${target.path}`
                        });
                    }
                });
            }
        });
        return res.length > 200 ? res.slice(0, 200) : res;
    }, [galaxyNodes]);

    return (
        <group>
            {connections.map(conn => (
                <EnergyBeam 
                    key={conn.id}
                    start={conn.start}
                    end={conn.end}
                    color={conn.color}
                />
            ))}
        </group>
    );
};
