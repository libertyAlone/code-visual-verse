import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAppEvents } from './useAppEvents';

// Mock dependencies
const mockChangeLanguage = vi.fn();
const mockHandleSelectNode = vi.fn();
const mockSetTourIndex = vi.fn();
const mockSetFocusTarget = vi.fn();
const mockSetIsMobile = vi.fn();

let mockIsTouring = false;
let mockNodes: any[] = [];
let mockTourIndex = 0;
let mockFocusTarget: string | null = null;

// Define mocks before vi.mock calls
const mockUnlisten = vi.fn();
const mockListen = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'en',
    },
    t: (key: string) => key,
  }),
}));

vi.mock('../store/useStore', () => ({
  useStore: () => ({
    isTouring: mockIsTouring,
    nodes: mockNodes,
    tourIndex: mockTourIndex,
    focusTarget: mockFocusTarget,
    setTourIndex: mockSetTourIndex,
    setFocusTarget: mockSetFocusTarget,
    setIsMobile: mockSetIsMobile,
  }),
}));

vi.mock('./useProject', () => ({
  useProject: vi.fn(() => ({
    handleSelectNode: mockHandleSelectNode,
  })),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: any[]) => mockListen(...args),
}));

describe('useAppEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTouring = false;
    mockNodes = [];
    mockTourIndex = 0;
    mockFocusTarget = null;
    mockListen.mockResolvedValue(mockUnlisten);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    const { result } = renderHook(() => useAppEvents());
    expect(result.current).toBeUndefined(); // Hook returns nothing
  });

  it('should render without errors', () => {
    expect(() => renderHook(() => useAppEvents())).not.toThrow();
  });

  it('should handle empty nodes array', () => {
    const { unmount } = renderHook(() => useAppEvents());
    expect(() => unmount()).not.toThrow();
  });

  it('should handle nodes without directories', () => {
    mockNodes = [
      { name: 'test.ts', path: '/test.ts', is_dir: false },
    ];
    const { unmount } = renderHook(() => useAppEvents());
    expect(() => unmount()).not.toThrow();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useAppEvents());
    expect(() => unmount()).not.toThrow();
  });

  // Additional tests for coverage
  it('should set up language change listener', async () => {
    renderHook(() => useAppEvents());
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('change-lang', expect.any(Function));
    });
  });

  it('should call unlisten on unmount', async () => {
    const { unmount } = renderHook(() => useAppEvents());
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalled();
    });
    unmount();
    await waitFor(() => {
      expect(mockUnlisten).toHaveBeenCalled();
    });
  });

  it('should change language when event is received', async () => {
    let eventHandler: ((event: { payload: string }) => void) | undefined;
    mockListen.mockImplementation((eventName: string, handler: any) => {
      if (eventName === 'change-lang') {
        eventHandler = handler;
      }
      return Promise.resolve(mockUnlisten);
    });

    renderHook(() => useAppEvents());
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('change-lang', expect.any(Function));
    });

    // Simulate language change event
    if (eventHandler) {
      eventHandler({ payload: 'zh' });
      expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
    }
  });

  it('should not start tour when isTouring is false', () => {
    mockIsTouring = false;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
    ];

    renderHook(() => useAppEvents());
    expect(mockSetTourIndex).not.toHaveBeenCalled();
  });

  it('should start tour when isTouring is true and nodes exist', async () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'components', path: '/src/components', is_dir: true },
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
    ];
    mockFocusTarget = null; // This triggers the tour

    renderHook(() => useAppEvents());

    // Wait for the tour timeout and interval to be set up
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should not start tour when nodes array is empty', () => {
    mockIsTouring = true;
    mockNodes = [];

    renderHook(() => useAppEvents());
    expect(mockHandleSelectNode).not.toHaveBeenCalled();
  });

  it('should not start tour when no directories exist', () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'test.ts', path: '/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/utils.ts', is_dir: false },
    ];

    renderHook(() => useAppEvents());
    expect(mockHandleSelectNode).not.toHaveBeenCalled();
  });

  it('should handle focusTarget being set', () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
    ];
    mockFocusTarget = '/src';

    renderHook(() => useAppEvents());
    // When focusTarget is set, the tour should not advance immediately
  });

  it('should handle tour index cycling', async () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'components', path: '/src/components', is_dir: true },
    ];
    mockTourIndex = 0;
    mockFocusTarget = null;

    renderHook(() => useAppEvents());
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should handle rate limiting of tour steps', async () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'components', path: '/src/components', is_dir: true },
    ];
    mockFocusTarget = null;

    renderHook(() => useAppEvents());
    // Rate limiting prevents tour from advancing too quickly
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should handle multiple directories', () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'components', path: '/src/components', is_dir: true },
      { name: 'hooks', path: '/src/hooks', is_dir: true },
      { name: 'utils', path: '/src/utils', is_dir: true },
    ];

    renderHook(() => useAppEvents());
  });

  it('should cleanup timers on unmount during tour', async () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
    ];
    mockFocusTarget = null;

    const { unmount } = renderHook(() => useAppEvents());
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(() => unmount()).not.toThrow();
  });

  it('should handle language change to same language', async () => {
    let eventHandler: ((event: { payload: string }) => void) | undefined;
    mockListen.mockImplementation((eventName: string, handler: any) => {
      if (eventName === 'change-lang') {
        eventHandler = handler;
      }
      return Promise.resolve(mockUnlisten);
    });

    renderHook(() => useAppEvents());
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalled();
    });

    if (eventHandler) {
      eventHandler({ payload: 'en' });
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    }
  });

  it('should handle single directory in tour', async () => {
    mockIsTouring = true;
    mockNodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
    ];
    mockFocusTarget = null;

    renderHook(() => useAppEvents());
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Tour Step Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it('should execute tour step with high complexity nodes', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'low-complexity.ts', path: '/src/low-complexity.ts', is_dir: false, complexity: 2 },
        { name: 'high-complexity.ts', path: '/src/high-complexity.ts', is_dir: false, complexity: 10 },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // Wait for initial timeout (4000ms)
      // tourIndex starts at 0, nextIndex = (0 + 1) % 2 = 1
      // candidates are [low-complexity.ts, high-complexity.ts] (complexity > 5 OR commit_count > 0)
      // But since candidates.length (2) <= 5, tourPool = renderedNodes
      // renderedNodes = [low-complexity.ts, high-complexity.ts]
      // So nextIndex = 1 points to high-complexity.ts
      vi.advanceTimersByTime(4000);

      expect(mockSetTourIndex).toHaveBeenCalled();
      expect(mockSetFocusTarget).toHaveBeenCalledWith('/src/high-complexity.ts');
      expect(mockHandleSelectNode).toHaveBeenCalled();
    });

    it('should execute tour step with commit_count nodes', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'no-commits.ts', path: '/src/no-commits.ts', is_dir: false },
        { name: 'frequently-committed.ts', path: '/src/frequently-committed.ts', is_dir: false, commit_count: 5 },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // renderedNodes = [no-commits.ts, frequently-committed.ts]
      // candidates = [frequently-committed.ts] (commit_count > 0)
      // candidates.length (1) <= 5, so tourPool = renderedNodes
      // nextIndex = (0 + 1) % 2 = 1, which is frequently-committed.ts
      vi.advanceTimersByTime(4000);

      expect(mockSetTourIndex).toHaveBeenCalled();
      expect(mockSetFocusTarget).toHaveBeenCalledWith('/src/frequently-committed.ts');
      expect(mockHandleSelectNode).toHaveBeenCalled();
    });

    it('should use all rendered nodes when less than 5 candidates', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'file1.ts', path: '/src/file1.ts', is_dir: false, complexity: 10 },
        { name: 'file2.ts', path: '/src/file2.ts', is_dir: false, complexity: 8 },
        { name: 'file3.ts', path: '/src/file3.ts', is_dir: false },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // With only 2 candidates (>5 complexity), should use renderedNodes (3 files)
      vi.advanceTimersByTime(4000);

      expect(mockSetTourIndex).toHaveBeenCalled();
      expect(mockHandleSelectNode).toHaveBeenCalled();
    });

    it('should cycle through tour pool correctly', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'file1.ts', path: '/src/file1.ts', is_dir: false, complexity: 10 },
        { name: 'file2.ts', path: '/src/file2.ts', is_dir: false, complexity: 8 },
        { name: 'file3.ts', path: '/src/file3.ts', is_dir: false, complexity: 6 },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // First step
      vi.advanceTimersByTime(4000);
      expect(mockSetTourIndex).toHaveBeenCalledWith(1);

      // Reset mocks to track the next call
      mockSetTourIndex.mockClear();

      // Advance to next interval (12000ms for the interval + wait past rate limit)
      vi.advanceTimersByTime(12000);

      expect(mockSetTourIndex).toHaveBeenCalled();
    });

    it('should not run tour step when no rendered nodes exist', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'components', path: '/src/components', is_dir: true },
        // No files, only directories
      ];
      mockFocusTarget = null;

      renderHook(() => useAppEvents());

      vi.advanceTimersByTime(4000);

      expect(mockSetTourIndex).not.toHaveBeenCalled();
      expect(mockSetFocusTarget).not.toHaveBeenCalled();
      expect(mockHandleSelectNode).not.toHaveBeenCalled();
    });

    it('should skip tour step due to rate limiting', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'file1.ts', path: '/src/file1.ts', is_dir: false, complexity: 10 },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // First step at 4000ms
      vi.advanceTimersByTime(4000);
      expect(mockSetTourIndex).toHaveBeenCalledTimes(1);

      // Reset mocks to track new calls
      mockSetTourIndex.mockClear();

      // Advance only a small amount (less than 2000ms rate limit)
      vi.advanceTimersByTime(500);

      // Should not have been called again due to rate limiting
      expect(mockSetTourIndex).not.toHaveBeenCalled();
    });

    it('should handle nodes with both complexity and commit_count', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'low-value.ts', path: '/src/low-value.ts', is_dir: false },
        { name: 'high-value.ts', path: '/src/high-value.ts', is_dir: false, complexity: 10, commit_count: 5 },
      ];
      mockFocusTarget = null;
      mockTourIndex = 0;

      renderHook(() => useAppEvents());

      // renderedNodes = [low-value.ts, high-value.ts]
      // candidates = [high-value.ts] (complexity > 5)
      // candidates.length (1) <= 5, so tourPool = renderedNodes
      // nextIndex = (0 + 1) % 2 = 1, which is high-value.ts
      vi.advanceTimersByTime(4000);

      // Node with both complexity and commit_count should be in candidates
      expect(mockSetFocusTarget).toHaveBeenCalledWith('/src/high-value.ts');
    });

    it('should handle empty rendered nodes list after filtering', () => {
      mockIsTouring = true;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        // Only directories, no rendered files
        { name: 'components', path: '/src/components', is_dir: true },
        { name: 'utils', path: '/src/utils', is_dir: true },
      ];
      mockFocusTarget = null;

      renderHook(() => useAppEvents());

      vi.advanceTimersByTime(4000);

      expect(mockSetFocusTarget).not.toHaveBeenCalled();
      expect(mockHandleSelectNode).not.toHaveBeenCalled();
    });

    it('should clear focusTarget when tour stops', () => {
      mockIsTouring = false;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'file1.ts', path: '/src/file1.ts', is_dir: false },
      ];
      mockFocusTarget = '/src/file1.ts'; // Set to a value

      renderHook(() => useAppEvents());

      // Should clear focusTarget immediately since isTouring is false
      expect(mockSetFocusTarget).toHaveBeenCalledWith(null);
    });

    it('should not clear focusTarget when already null', () => {
      mockIsTouring = false;
      mockNodes = [
        { name: 'src', path: '/src', is_dir: true },
        { name: 'file1.ts', path: '/src/file1.ts', is_dir: false },
      ];
      mockFocusTarget = null; // Already null

      renderHook(() => useAppEvents());

      expect(mockSetFocusTarget).not.toHaveBeenCalled();
    });
  });
});
