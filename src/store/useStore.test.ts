import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

// Reset store state before each test

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const state = useStore.getState();
    state.setNodes([]);
    state.setProjectPath(null);
    state.setSelectedNode(null);
    state.setLoading(false);
    state.setDirColors([]);
    state.setGlobalCommits([]);
    state.setMessages([]);
    state.setIsAIChatOpen(false);
    state.setIsGeneratingMindMap(false);
  });

  describe('Basic State Management', () => {
    it('should have correct initial state', () => {
      const state = useStore.getState();
      expect(state.nodes).toEqual([]);
      expect(state.projectPath).toBeNull();
      expect(state.selectedNode).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.maxDepth).toBe(2);
      expect(state.onlySrc).toBe(true);
    });

    it('should update nodes', () => {
      const { setNodes } = useStore.getState();
      const mockNodes = [
        { name: 'test.ts', path: '/test.ts', is_dir: false, size: 100, functions: [], imports: [] },
      ];
      setNodes(mockNodes as any);
      expect(useStore.getState().nodes).toEqual(mockNodes);
    });

    it('should update project path', () => {
      const { setProjectPath } = useStore.getState();
      setProjectPath('/path/to/project');
      expect(useStore.getState().projectPath).toBe('/path/to/project');
    });

    it('should update selected node', () => {
      const { setSelectedNode } = useStore.getState();
      const mockNode = { name: 'App.tsx', path: '/App.tsx', is_dir: false, size: 200 };
      setSelectedNode(mockNode as any);
      expect(useStore.getState().selectedNode).toEqual(mockNode);
    });

    it('should update loading state', () => {
      const { setLoading } = useStore.getState();
      setLoading(true);
      expect(useStore.getState().loading).toBe(true);
      setLoading(false);
      expect(useStore.getState().loading).toBe(false);
    });

    it('should update showDetail state', () => {
      const { setShowDetail } = useStore.getState();
      setShowDetail(true);
      expect(useStore.getState().showDetail).toBe(true);
    });
  });

  describe('UI Settings', () => {
    it('should update maxDepth', () => {
      const { setMaxDepth } = useStore.getState();
      setMaxDepth(5);
      expect(useStore.getState().maxDepth).toBe(5);
    });

    it('should update onlySrc', () => {
      const { setOnlySrc } = useStore.getState();
      setOnlySrc(false);
      expect(useStore.getState().onlySrc).toBe(false);
    });

    it('should update ignoreDotFiles', () => {
      const { setIgnoreDotFiles } = useStore.getState();
      setIgnoreDotFiles(false);
      expect(useStore.getState().ignoreDotFiles).toBe(false);
    });

    it('should update ignoreGitIgnore', () => {
      const { setIgnoreGitIgnore } = useStore.getState();
      setIgnoreGitIgnore(false);
      expect(useStore.getState().ignoreGitIgnore).toBe(false);
    });

    it('should update showAllDependencies', () => {
      const { setShowAllDependencies } = useStore.getState();
      setShowAllDependencies(true);
      expect(useStore.getState().showAllDependencies).toBe(true);
    });

    it('should update search query', () => {
      const { setSearchQuery } = useStore.getState();
      setSearchQuery('component');
      expect(useStore.getState().searchQuery).toBe('component');
    });
  });

  describe('Tour State', () => {
    it('should update touring state', () => {
      const { setIsTouring } = useStore.getState();
      setIsTouring(true);
      expect(useStore.getState().isTouring).toBe(true);
    });

    it('should update tour index', () => {
      const { setTourIndex } = useStore.getState();
      setTourIndex(3);
      expect(useStore.getState().tourIndex).toBe(3);
    });

    it('should update focus target', () => {
      const { setFocusTarget } = useStore.getState();
      setFocusTarget('/src/App.tsx');
      expect(useStore.getState().focusTarget).toBe('/src/App.tsx');
    });
  });

  describe('Directory Colors', () => {
    it('should update dirColors', () => {
      const { setDirColors } = useStore.getState();
      const colors = [
        { name: 'src', color: '#ff0000', path: '/src' },
        { name: 'components', color: '#00ff00', path: '/src/components' },
      ];
      setDirColors(colors);
      expect(useStore.getState().dirColors).toEqual(colors);
    });
  });

  describe('Git Integration', () => {
    it('should update global commits', () => {
      const { setGlobalCommits } = useStore.getState();
      const commits = [
        { hash: 'abc123', author: 'User', date: '2024-01-01', message: 'Initial commit', branches: 'main' },
      ];
      setGlobalCommits(commits as any);
      expect(useStore.getState().globalCommits).toEqual(commits);
    });

    it('should update selected commit hash', () => {
      const { setSelectedCommitHash } = useStore.getState();
      setSelectedCommitHash('abc123');
      expect(useStore.getState().selectedCommitHash).toBe('abc123');
    });

    it('should update birth times', () => {
      const { setBirthTimes } = useStore.getState();
      const times = { 'file1.ts': 1640000000, 'file2.ts': 1640000001 };
      setBirthTimes(times);
      expect(useStore.getState().birthTimes).toEqual(times);
    });
  });

  describe('AI Integration', () => {
    it('should update AI config', () => {
      const { setAIConfig } = useStore.getState();
      setAIConfig({ apiKey: 'test-key', model: 'gpt-3.5' });
      const state = useStore.getState();
      expect(state.aiConfig.apiKey).toBe('test-key');
      expect(state.aiConfig.model).toBe('gpt-3.5');
      expect(state.aiConfig.protocol).toBe('openai'); // unchanged
    });

    it('should update messages', () => {
      const { setMessages } = useStore.getState();
      const messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      setMessages(messages as any);
      expect(useStore.getState().messages).toEqual(messages);
    });

    it('should add message', () => {
      const { addMessage } = useStore.getState();
      const message = { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() };
      addMessage(message as any);
      expect(useStore.getState().messages).toContainEqual(message);
    });

    it('should clear messages', () => {
      const { addMessage, clearMessages } = useStore.getState();
      addMessage({ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() } as any);
      clearMessages();
      expect(useStore.getState().messages).toEqual([]);
    });

    it('should update isAIChatOpen', () => {
      const { setIsAIChatOpen } = useStore.getState();
      setIsAIChatOpen(true);
      expect(useStore.getState().isAIChatOpen).toBe(true);
    });

    it('should update isGeneratingMindMap', () => {
      const { setIsGeneratingMindMap } = useStore.getState();
      setIsGeneratingMindMap(true);
      expect(useStore.getState().isGeneratingMindMap).toBe(true);
    });

    it('should update isAISettingsModalOpen', () => {
      const { setIsAISettingsModalOpen } = useStore.getState();
      setIsAISettingsModalOpen(true);
      expect(useStore.getState().isAISettingsModalOpen).toBe(true);
    });
  });
});
