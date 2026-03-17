import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

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
    birthTime?: number;
}

export interface GitLog {
    hash: string;
    author: string;
    date: string;
    message: string;
    branches: string;
}

export type AIProtocol = 'openai' | 'anthropic';

export interface AIConfig {
    protocol: AIProtocol;
    apiKey: string;
    baseUrl: string;
    model: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

interface AppState {
    // Data
    nodes: ProjectFile[];
    projectPath: string | null;
    selectedNode: ProjectFile | null;
    dirColors: { name: string, color: string, path: string }[];
    globalCommits: GitLog[];
    selectedCommitHash: string | null;
    birthTimes: Record<string, number>;
    
    // UI State
    loading: boolean;
    showDetail: boolean;
    isTouring: boolean;
    tourIndex: number;
    focusTarget: string | null;
    searchQuery: string;
    maxDepth: number;
    onlySrc: boolean;
    ignoreDotFiles: boolean;
    ignoreGitIgnore: boolean;
    showAllDependencies: boolean;

    // AI State
    aiConfig: AIConfig;
    messages: Message[];
    isAIChatOpen: boolean;
    isGeneratingMindMap: boolean;
    isAISettingsModalOpen: boolean;

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
    setIgnoreDotFiles: (ignore: boolean) => void;
    setIgnoreGitIgnore: (ignore: boolean) => void;
    setShowAllDependencies: (show: boolean) => void;
    setDirColors: (colors: { name: string, color: string, path: string }[]) => void;
    setGlobalCommits: (commits: GitLog[]) => void;
    setSelectedCommitHash: (hash: string | null) => void;
    setBirthTimes: (times: Record<string, number>) => void;
    
    // AI Actions
    setAIConfig: (config: Partial<AIConfig>) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    setIsAIChatOpen: (isOpen: boolean) => void;
    setIsGeneratingMindMap: (isGenerating: boolean) => void;
    setIsAISettingsModalOpen: (isOpen: boolean) => void;
    clearMessages: () => void;
}

const customStorage = {
    getItem: async (_name: string): Promise<string | null> => {
        try {
            const config = await invoke<string>('load_app_config');
            return config;
        } catch (e) {
            console.error('Failed to load config:', e);
            return null;
        }
    },
    setItem: async (_name: string, value: string): Promise<void> => {
        try {
            await invoke('save_app_config', { config: value });
        } catch (e) {
            console.error('Failed to save config:', e);
        }
    },
    removeItem: async (_name: string) => {
        // No-op
    },
};

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Initial states
            nodes: [],
            projectPath: null,
            selectedNode: null,
            dirColors: [],
            globalCommits: [],
            selectedCommitHash: null,
            birthTimes: {},
            loading: false,
            showDetail: false,
            isTouring: false,
            tourIndex: 0,
            focusTarget: null,
            searchQuery: '',
            maxDepth: 2,
            onlySrc: true,
            ignoreDotFiles: true,
            ignoreGitIgnore: true,
            showAllDependencies: false,

            // AI Initial States
            aiConfig: {
                protocol: 'openai',
                apiKey: '',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
            },
            messages: [],
            isAIChatOpen: false,
            isGeneratingMindMap: false,
            isAISettingsModalOpen: false,

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
            setIgnoreDotFiles: (ignoreDotFiles) => set({ ignoreDotFiles }),
            setIgnoreGitIgnore: (ignoreGitIgnore) => set({ ignoreGitIgnore }),
            setShowAllDependencies: (showAllDependencies) => set({ showAllDependencies }),
            setDirColors: (dirColors) => set({ dirColors }),
            setGlobalCommits: (globalCommits) => set({ globalCommits }),
            setSelectedCommitHash: (selectedCommitHash) => set({ selectedCommitHash }),
            setBirthTimes: (birthTimes) => set({ birthTimes }),

            // AI Actions
            setAIConfig: (config) => set((state) => ({ 
                aiConfig: { ...state.aiConfig, ...config } 
            })),
            setMessages: (messages) => set({ messages }),
            addMessage: (message) => set((state) => ({ 
                messages: [...state.messages, message] 
            })),
            setIsAIChatOpen: (isAIChatOpen) => set({ isAIChatOpen }),
            setIsGeneratingMindMap: (isGeneratingMindMap) => set({ isGeneratingMindMap }),
            setIsAISettingsModalOpen: (isOpen) => set({ isAISettingsModalOpen: isOpen }),
            clearMessages: () => set({ messages: [] }),
        }),
        {
            name: 'visual-verse-storage',
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({
                maxDepth: state.maxDepth,
                onlySrc: state.onlySrc,
                ignoreDotFiles: state.ignoreDotFiles,
                ignoreGitIgnore: state.ignoreGitIgnore,
                showAllDependencies: state.showAllDependencies,
                aiConfig: state.aiConfig,
            }),
        }
    )
);
