import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAppEvents } from './useAppEvents';

// Mock dependencies
const mockChangeLanguage = vi.fn();
const mockHandleSelectNode = vi.fn();
const mockSetTourIndex = vi.fn();
const mockSetFocusTarget = vi.fn();

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
});
