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
        maxDepth 
    } = useStore();

    const handleImport = async () => {
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
                    const files: ProjectFile[] = await invoke("scan_project", {
                        path: selected,
                        onlySrc,
                        maxDepth,
                    });

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
    };

    const handleSelectNode = async (node: ProjectFile) => {
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
    };

    return {
        handleImport,
        handleSelectNode
    };
};
