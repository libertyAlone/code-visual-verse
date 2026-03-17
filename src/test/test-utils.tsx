import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi, type Mock } from 'vitest';

// Test utilities type
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Record<string, unknown>;
}

// Mock store provider wrapper
function createMockStoreProvider(_initialState: Record<string, unknown> = {}) {
  return function MockStoreProvider({ children }: { children: ReactNode }) {
    // This is a simplified mock - in real tests, use actual Zustand store mocking
    return <>{children}</>;
  };
}

// Custom render function with providers
// Custom render function with providers
export function customRender(
  ui: ReactElement,
  { initialState = {}, ...options }: CustomRenderOptions = {}
) {
  const Wrapper = createMockStoreProvider(initialState);
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export testing-library utilities (excluding render which we override)
export * from '@testing-library/react';
export { customRender as render };

// Helper to create mock file system nodes
export function createMockNode(overrides: Partial<import('../types').FileNode> = {}) {
  return {
    name: 'test.ts',
    path: '/test.ts',
    is_dir: false,
    size: 100,
    extension: 'ts',
    depth: 0,
    created_at: Date.now(),
    modified_at: Date.now(),
    commit_count: 0,
    has_readme: false,
    ...overrides,
  };
}

// Helper to create mock project data
export function createMockProject(overrides: Partial<import('../types').ProjectData> = {}) {
  return {
    nodes: [],
    stats: {
      totalFiles: 0,
      totalDirs: 0,
      totalSize: 0,
      maxDepth: 0,
    },
    ...overrides,
  };
}

// Async wait helper
export function wait(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Type-safe mock creator
export function createMock<T extends (...args: any[]) => any>(): Mock<T> {
  return vi.fn() as Mock<T>;
}
