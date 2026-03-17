import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProject } from './useProject';

// Mock the store
const mockSetNodes = vi.fn();
const mockSetLoading = vi.fn();
const mockSetProjectPath = vi.fn();
const mockSetSelectedNode = vi.fn();
const mockSetBirthTimes = vi.fn();
const mockGetState = vi.fn(() => ({
  onlySrc: true,
  maxDepth: 2,
  ignoreDotFiles: true,
  ignoreGitIgnore: true,
  nodes: [],
}));

vi.mock('../store/useStore', () => ({
  useStore: Object.assign(
    () => ({
      setNodes: mockSetNodes,
      setLoading: mockSetLoading,
      setProjectPath: mockSetProjectPath,
      setSelectedNode: mockSetSelectedNode,
      setBirthTimes: mockSetBirthTimes,
      onlySrc: true,
      maxDepth: 2,
    }),
    { getState: () => mockGetState() }
  ),
}));

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(args[0], args[1]),
}));

const mockOpen = vi.fn();
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: any[]) => mockOpen(...args),
}));

vi.mock('../lib/ast-processor', () => ({
  processFile: () => ({
    functions: ['test'],
    imports: ['react'],
    complexity: 1,
  }),
}));

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
    mockOpen.mockReset();
  });

  describe('handleImport', () => {
    it('should be defined', () => {
      const { result } = renderHook(() => useProject());
      expect(result.current.handleImport).toBeDefined();
    });

    it('should handleImport with no directory selected', async () => {
      mockOpen.mockResolvedValue(null);
      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.handleImport();
      });

      expect(mockSetProjectPath).not.toHaveBeenCalled();
    });

    it('should handleImport with valid directory', async () => {
      mockOpen.mockResolvedValue('/test/project');
      mockInvoke.mockResolvedValue([
        { name: 'test.ts', path: '/test/project/test.ts', is_dir: false, size: 100, created_at: 0, modified_at: 0 },
      ]);

      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.handleImport();
      });

      await waitFor(() => {
        expect(mockSetLoading).toHaveBeenCalledWith(true);
      });
    });

    it('should handleImport with source files', async () => {
      mockOpen.mockResolvedValue('/test/project');
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === 'read_file') return Promise.resolve('const x = 1;');
        if (cmd === 'scan_project') return Promise.resolve([{ name: 'App.tsx', path: '/test/project/App.tsx', is_dir: false, size: 100, created_at: 0, modified_at: 0 }]);
        if (cmd === 'get_all_files_birth_times') return Promise.resolve({});
        return Promise.resolve('');
      });

      const { result } = renderHook(() => useProject());
      await act(async () => { await result.current.handleImport(); });
    });
  });

  describe('handleSelectNode', () => {
    it('should skip directories', async () => {
      const { result } = renderHook(() => useProject());
      const dirNode = { name: 'src', path: '/project/src', is_dir: true, size: 0, created_at: 0, modified_at: 0 };
      await act(async () => { await result.current.handleSelectNode(dirNode as any); });
      expect(mockSetSelectedNode).not.toHaveBeenCalled();
    });

    it('should select file and parse if source', async () => {
      mockInvoke.mockResolvedValue('const x = 1;');
      const { result } = renderHook(() => useProject());
      const fileNode = { name: 'App.tsx', path: '/project/App.tsx', is_dir: false, size: 100, created_at: 0, modified_at: 0 };
      await act(async () => { await result.current.handleSelectNode(fileNode as any); });
      expect(mockSetSelectedNode).toHaveBeenCalled();
    });
  });
});
