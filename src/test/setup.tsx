import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  Channel: vi.fn(() => ({
    onmessage: vi.fn(),
  })),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
  message: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  readDir: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-log', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
}));

// Mock Three.js modules
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: {},
    scene: {},
    gl: {},
    size: { width: 800, height: 600 },
  })),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  Text: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  useTexture: vi.fn(() => ({})),
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
  return setTimeout(callback, 1) as unknown as number;
});

global.cancelIdleCallback = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock console methods in test environment
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out React warnings about act() in development
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: An update to') || args[0].includes('was not wrapped in act'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
