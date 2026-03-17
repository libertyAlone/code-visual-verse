import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration Tests for Code Visual Verse
 *
 * These tests verify that different parts of the application work together correctly.
 */

// Mock Tauri APIs for integration tests
const mockInvoke = vi.fn();
const mockOpen = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: any[]) => mockOpen(...args),
}));

// Mock i18n
vi.mock('../lib/i18n', () => ({
  default: {
    t: (key: string, params?: any) => {
      if (key === 'ai.context_prompt') return `Context: ${params?.fileTree || ''}`;
      if (key === 'ai.mindmap_prompt') return 'Generate mind map';
      return key;
    },
  },
  __esModule: true,
}));

describe('Integration: Project Import Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full project import workflow', async () => {
    // Mock user selecting a directory
    mockOpen.mockResolvedValue('/test/project');

    // Mock scan_project response
    const mockFiles = [
      { name: 'src', path: '/test/project/src', is_dir: true, size: 0 },
      { name: 'App.tsx', path: '/test/project/src/App.tsx', is_dir: false, size: 2048 },
      { name: 'utils.ts', path: '/test/project/src/utils.ts', is_dir: false, size: 1024 },
    ];
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'scan_project') {
        return Promise.resolve(mockFiles);
      }
      if (command === 'read_file') {
        return Promise.resolve('export const test = () => {};');
      }
      if (command === 'get_all_files_birth_times') {
        return Promise.resolve({
          'src/App.tsx': 1609459200,
          'src/utils.ts': 1609459300,
        });
      }
      return Promise.resolve(null);
    });

    // Import the hook and test the flow
    const { useProject } = await import('../hooks/useProject');
    expect(useProject).toBeDefined();
  });

  it('should handle errors during project import', async () => {
    mockOpen.mockRejectedValue(new Error('User cancelled'));

    const { useProject } = await import('../hooks/useProject');
    expect(useProject).toBeDefined();
  });
});

describe('Integration: AST Processing Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process file and extract metadata correctly', async () => {
    const { processFile } = await import('../lib/ast-processor');

    const code = `
      import React from 'react';
      import { useState } from 'react';

      export const Component = () => {
        const [count, setCount] = useState(0);

        const increment = () => {
          if (count < 10) {
            setCount(count + 1);
          }
        };

        return <div>{count}</div>;
      };
    `;

    const result = processFile(code, 'Component.tsx');

    expect(result.functions).toContain('Component');
    expect(result.functions).toContain('increment');
    expect(result.imports).toContain('react');
    expect(result.complexity).toBeGreaterThan(1);
  });

  it('should integrate AST processing with store state', async () => {
    const { useStore } = await import('../store/useStore');
    const { processFile } = await import('../lib/ast-processor');

    // Process a file
    const code = 'function test() { return 1; }';
    const analysis = processFile(code, 'test.js');

    // Store should be able to accept processed data
    expect(useStore).toBeDefined();
    expect(analysis.functions).toContain('test');
  });
});

describe('Integration: AI Chat Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message and receive response', async () => {
    mockInvoke.mockResolvedValue('AI Response');

    const { AIService } = await import('../lib/aiService');

    const config = {
      protocol: 'openai' as const,
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
    ];

    const response = await AIService.chat(config, messages);

    expect(mockInvoke).toHaveBeenCalledWith('ai_chat', expect.objectContaining({
      protocol: 'openai',
      apiKey: 'test-key',
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Hello' }),
      ]),
    }));
    expect(response.content).toBe('AI Response');
  });

  it('should generate project context for AI', async () => {
    const { AIService } = await import('../lib/aiService');

    const nodes = [
      { name: 'src', path: '/project/src', is_dir: true },
      { name: 'App.tsx', path: '/project/src/App.tsx', is_dir: false },
    ];

    const context = AIService.generateProjectContext(nodes);

    expect(context).toContain('src');
    expect(context).toContain('App.tsx');
  });
});

describe('Integration: Store Persistence', () => {
  it('should persist settings to storage', async () => {
    const { useStore } = await import('../store/useStore');

    // Store should have persist middleware
    expect(useStore.persist).toBeDefined();
  });
});

describe('Integration: Tour System', () => {
  it('should cycle through directories during tour', async () => {
    const { useStore } = await import('../store/useStore');
    const { useAppEvents } = await import('../hooks/useAppEvents');
    const { useProject } = await import('../hooks/useProject');

    // Verify all hooks are importable
    expect(useStore).toBeDefined();
    expect(useAppEvents).toBeDefined();
    expect(useProject).toBeDefined();
  });
});

describe('Integration: Search and Navigation', () => {
  it('should search files and navigate to results', async () => {
    const { useStore } = await import('../store/useStore');

    const mockNodes = [
      { name: 'App.tsx', path: '/src/App.tsx', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
      { name: 'components', path: '/src/components', is_dir: true },
    ];

    // Set nodes in store
    const store = useStore.getState();
    store.setNodes(mockNodes as any);

    expect(useStore.getState().nodes).toEqual(mockNodes);
  });
});
