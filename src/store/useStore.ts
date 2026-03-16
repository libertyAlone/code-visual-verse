import { create } from 'zustand';

export interface ProjectFile {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    functions?: string[];
    imports?: string[];
    complexity?: number;
    created_at: number;
    modified_at: number;
    sector?: string;
    color?: string;
    commit_count?: number;
    has_readme?: boolean;
}

interface AppState {
    // Data
    nodes: ProjectFile[];
    projectPath: string | null;
    selectedNode: ProjectFile | null;
    dirColors: { name: string, color: string, path: string }[];
    
    // UI State
    loading: boolean;
    showDetail: boolean;
    isTouring: boolean;
    tourIndex: number;
    focusTarget: string | null;
    searchQuery: string;
    maxDepth: number;
    onlySrc: boolean;

    // Actions
    setNodes: (nodes: ProjectFile[]) => void;
    setProjectPath: (path: string | null) => void;
    setSelectedNode: (node: ProjectFile | null) => void;
    setLoading: (loading: boolean) => void;
    setShowDetail: (show: boolean) => void;
    setIsTouring: (touring: boolean) => void;
    setTourIndex: (index: number) => void;
    setFocusTarget: (target: string | null) => void;
    setSearchQuery: (query: string) => void;
    setMaxDepth: (depth: number) => void;
    setOnlySrc: (onlySrc: boolean) => void;
    setDirColors: (colors: { name: string, color: string, path: string }[]) => void;
}

export const useStore = create<AppState>((set) => ({
    // Initial states
    nodes: [],
    projectPath: null,
    selectedNode: null,
    dirColors: [],
    loading: false,
    showDetail: false,
    isTouring: false,
    tourIndex: 0,
    focusTarget: null,
    searchQuery: '',
    maxDepth: 2,
    onlySrc: true,

    // Actions
    setNodes: (nodes) => set({ nodes }),
    setProjectPath: (projectPath) => set({ projectPath }),
    setSelectedNode: (selectedNode) => set({ selectedNode }),
    setLoading: (loading) => set({ loading }),
    setShowDetail: (showDetail) => set({ showDetail }),
    setIsTouring: (isTouring) => set({ isTouring }),
    setTourIndex: (tourIndex) => set({ tourIndex }),
    setFocusTarget: (focusTarget) => set({ focusTarget }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setMaxDepth: (maxDepth) => set({ maxDepth }),
    setOnlySrc: (onlySrc) => set({ onlySrc }),
    setDirColors: (dirColors) => set({ dirColors }),
}));
