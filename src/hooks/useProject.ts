import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { processFile } from "../lib/ast-processor";
import { useStore, ProjectFile } from "../store/useStore";

export const useProject = () => {
    const { 
        setNodes, 
        setLoading, 
        setProjectPath, 
        setSelectedNode,
        onlySrc,
        maxDepth,
        setBirthTimes
    } = useStore();

    const handleImport = useCallback(async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });

            if (selected) {
                setProjectPath(selected as string);
                setLoading(true);
                setNodes([]);
                try {
                    const { ignoreDotFiles, ignoreGitIgnore } = useStore.getState();
                    console.log("Invoking scan_project with path:", selected);
                    const files: ProjectFile[] = await invoke("scan_project", {
                        path: selected,
                        onlySrc,
                        maxDepth,
                        ignoreDotFiles,
                        ignoreGitignore: ignoreGitIgnore,
                    });
                    console.log("Scan result:", files?.length, "files found");

                    if (!Array.isArray(files)) {
                        console.error("Invalid response from scan_project:", files);
                        setLoading(false);
                        return;
                    }

                    const uniqueFilesMap = new Map();
                    files.forEach((f) => {
                        if (f && f.path) {
                            uniqueFilesMap.set(f.path, f);
                        }
                    });
                    const uniqueFiles = Array.from(uniqueFilesMap.values());

                    if (uniqueFiles.length === 0) {
                        setNodes([]);
                        setLoading(false);
                        return;
                    }

                    const enrichedFiles = [...uniqueFiles];
                    const sourceFiles = uniqueFiles.filter(
                        (f) =>
                            !f.is_dir &&
                            ["ts", "tsx", "js", "jsx"].some((ext) =>
                                f.name.toLowerCase().endsWith(ext),
                            ),
                    );

                    const subset = sourceFiles.slice(0, 30);
                    const batchSize = 5;
                    for (let i = 0; i < subset.length; i += batchSize) {
                        const batch = subset.slice(i, i + batchSize);
                        await Promise.all(
                            batch.map(async (file) => {
                                try {
                                    const content: string = await invoke("read_file", {
                                        path: file.path,
                                    });
                                    const analysis = processFile(content, file.name);
                                    const idx = enrichedFiles.findIndex(
                                        (f) => f.path === file.path,
                                    );
                                    if (idx !== -1) {
                                        enrichedFiles[idx] = { ...enrichedFiles[idx], ...analysis };
                                    }
                                } catch (e) {
                                    console.warn(`Skip parsing ${file.name}:`, e);
                                }
                            }),
                        );
                    }

                    setNodes(enrichedFiles);

                    try {
                        const birthTimes: Record<string, number> = await invoke("get_all_files_birth_times", {
                            path: selected as string
                        });
                        setBirthTimes(birthTimes);
                        
                        const normRoot = (selected as string).replace(/\\/g, '/').toLowerCase();
                        
                        setNodes(enrichedFiles.map(node => {
                            const currentPath = node.path.replace(/\\/g, '/');
                            const currentNormPath = currentPath.toLowerCase();
                            
                            let key = currentPath;
                            if (currentNormPath.startsWith(normRoot)) {
                                key = currentPath.substring(normRoot.length).replace(/^[/\\]+/, '');
                            }
                            
                            // Try both original and lowercase for birthTimes lookup, fallback to filesystem created_at
                            const bTime = birthTimes[key] || birthTimes[key.toLowerCase()] || node.created_at || 0;
                            
                            return {
                                ...node,
                                birthTime: Number(bTime)
                            };
                        }));
                    } catch (e) {
                        console.warn("Failed to fetch Git birth times:", e);
                    }
                } catch (error) {
                    console.error("Import failed:", error);
                    setNodes([]);
                } finally {
                    setLoading(false);
                }
            }
        } catch (e) {
            console.error("Import dialog failed:", e);
            setLoading(false);
        }
    }, [onlySrc, maxDepth, setNodes, setLoading, setProjectPath, setBirthTimes]);

    const handleSelectNode = useCallback(async (node: ProjectFile) => {
        const { selectedNode } = useStore.getState();
        if (selectedNode?.path === node.path) {
            setSelectedNode(null);
            return;
        }

        if (node.is_dir) return;

        if (node.functions) {
            setSelectedNode(node);
            return;
        }

        const isSourceFile = ["ts", "tsx", "js", "jsx", "rs", "py", "go"].some(
            (ext) => node.name.toLowerCase().endsWith(ext),
        );
        if (!isSourceFile) {
            setSelectedNode(node);
            return;
        }

        try {
            const content: string = await invoke("read_file", { path: node.path });
            const result = processFile(content, node.name);

            const updatedNode = {
                ...node,
                ...result,
            };

            setNodes(useStore.getState().nodes.map((n) => (n.path === node.path ? updatedNode : n)));
            setSelectedNode(updatedNode);
        } catch (e) {
            console.error("Failed to parse file:", e);
            setSelectedNode(node);
        }
    }, [setNodes, setSelectedNode]);

    return {
        handleImport,
        handleSelectNode
    };
};
