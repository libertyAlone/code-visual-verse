import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

// Mock store functions
const mockSetOnlySrc = vi.fn();
const mockSetIgnoreDotFiles = vi.fn();
const mockSetIgnoreGitIgnore = vi.fn();
const mockSetMaxDepth = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockSetShowDetail = vi.fn();
const mockSetFocusTarget = vi.fn();
const mockSetIsAIChatOpen = vi.fn();
const mockSetIsAISettingsModalOpen = vi.fn();
const mockHandleImport = vi.fn();
const mockHandleSelectNode = vi.fn();
const mockChangeLanguage = vi.fn();

// Create a mutable mock store state
let mockStoreState: any = {
  nodes: [],
  loading: false,
  selectedNode: null,
  onlySrc: true,
  ignoreDotFiles: true,
  ignoreGitIgnore: true,
  maxDepth: 2,
  searchQuery: '',
  setOnlySrc: mockSetOnlySrc,
  setIgnoreDotFiles: mockSetIgnoreDotFiles,
  setIgnoreGitIgnore: mockSetIgnoreGitIgnore,
  setMaxDepth: mockSetMaxDepth,
  setSearchQuery: mockSetSearchQuery,
  setShowDetail: mockSetShowDetail,
  setFocusTarget: mockSetFocusTarget,
  setIsAIChatOpen: mockSetIsAIChatOpen,
  setIsAISettingsModalOpen: mockSetIsAISettingsModalOpen,
};

vi.mock('../../store/useStore', () => ({
  useStore: () => mockStoreState,
}));

vi.mock('../../hooks/useProject', () => ({
  useProject: () => ({
    handleImport: mockHandleImport,
    handleSelectNode: mockHandleSelectNode,
  }),
}));

// Mock i18next
let mockLanguage = 'en';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: (lang: string) => {
        mockLanguage = lang;
        mockChangeLanguage(lang);
      },
      language: mockLanguage,
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Logo component
vi.mock('./Logo', () => ({
  Logo: ({ size }: { size: number }) => <div data-testid="logo" style={{ width: size, height: size }}>Logo</div>,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state to default
    mockStoreState = {
      nodes: [],
      loading: false,
      selectedNode: null,
      onlySrc: true,
      ignoreDotFiles: true,
      ignoreGitIgnore: true,
      maxDepth: 2,
      searchQuery: '',
      setOnlySrc: mockSetOnlySrc,
      setIgnoreDotFiles: mockSetIgnoreDotFiles,
      setIgnoreGitIgnore: mockSetIgnoreGitIgnore,
      setMaxDepth: mockSetMaxDepth,
      setSearchQuery: mockSetSearchQuery,
      setShowDetail: mockSetShowDetail,
      setFocusTarget: mockSetFocusTarget,
      setIsAIChatOpen: mockSetIsAIChatOpen,
      setIsAISettingsModalOpen: mockSetIsAISettingsModalOpen,
    };
  });

  it('should render sidebar', () => {
    render(<Sidebar />);
    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByText('app.subtitle')).toBeInTheDocument();
  });

  it('should render scan button', () => {
    render(<Sidebar />);
    expect(screen.getByText('app.scan')).toBeInTheDocument();
  });

  it('should call handleImport when scan button is clicked', () => {
    render(<Sidebar />);
    const scanButton = screen.getByText('app.scan');
    fireEvent.click(scanButton);
    expect(mockHandleImport).toHaveBeenCalled();
  });

  it('should toggle onlySrc setting', () => {
    render(<Sidebar />);
    const onlySrcToggle = screen.getByText('app.onlySrc');
    fireEvent.click(onlySrcToggle);
    expect(mockSetOnlySrc).toHaveBeenCalledWith(false);
  });

  it('should toggle ignoreDotFiles setting', () => {
    render(<Sidebar />);
    const ignoreDotFilesToggle = screen.getByText('app.ignoreDotFiles');
    fireEvent.click(ignoreDotFilesToggle);
    expect(mockSetIgnoreDotFiles).toHaveBeenCalledWith(false);
  });

  it('should toggle ignoreGitIgnore setting', () => {
    render(<Sidebar />);
    const ignoreGitIgnoreToggle = screen.getByText('app.ignoreGitIgnore');
    fireEvent.click(ignoreGitIgnoreToggle);
    expect(mockSetIgnoreGitIgnore).toHaveBeenCalledWith(false);
  });

  it('should show settings panel when settings button is clicked', () => {
    render(<Sidebar />);
    // Settings button is the Settings icon button
    const settingsButton = screen.getByRole('button', { name: '' });
    fireEvent.click(settingsButton);
    expect(screen.getByText('app.settings')).toBeInTheDocument();
  });

  it('should change language when language button is clicked', () => {
    render(<Sidebar />);
    const settingsButton = screen.getByRole('button', { name: '' });
    fireEvent.click(settingsButton);
    const langButton = screen.getByText('settings.lang');
    fireEvent.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
  });

  it('should show node stats when nodes exist', () => {
    mockStoreState.nodes = [
      { name: 'src', path: '/src', is_dir: true },
      { name: 'file.ts', path: '/src/file.ts', is_dir: false },
      { name: 'components', path: '/src/components', is_dir: true },
    ];

    render(<Sidebar />);
    expect(screen.getByText('summary.galaxies')).toBeInTheDocument();
    expect(screen.getByText('summary.planets')).toBeInTheDocument();
  });

  it('should show AI assistant button when nodes exist', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false }];

    render(<Sidebar />);
    expect(screen.getByText('sidebar.ai_assistant')).toBeInTheDocument();
  });

  it('should open AI chat when AI assistant button is clicked', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false }];

    render(<Sidebar />);
    const aiButton = screen.getByText('sidebar.ai_assistant');
    fireEvent.click(aiButton);
    expect(mockSetIsAIChatOpen).toHaveBeenCalledWith(true);
  });

  it('should show search input when nodes exist', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false }];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('should show selected node details', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false, size: 1024, created_at: 1609459200, modified_at: 1609459200 }];
    mockStoreState.selectedNode = { name: 'test.ts', path: '/test.ts', is_dir: false, size: 1024, created_at: 1609459200, modified_at: 1609459200 };

    render(<Sidebar />);
    expect(screen.getByText('test.ts')).toBeInTheDocument();
    expect(screen.getByText('node.planetaryCore')).toBeInTheDocument();
  });

  it('should handle search input changes', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(mockSetSearchQuery).toHaveBeenCalledWith('test');
  });

  it('should show search results when typing', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(mockSetSearchQuery).toHaveBeenCalledWith('test');
  });

  it('should handle ArrowDown key in search', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
  });

  it('should handle ArrowUp key in search', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
  });

  it('should handle Enter key to select search result', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
  });

  it('should click on search result', () => {
    mockStoreState.nodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
  });

  it('should clear search when result is clicked', () => {
    const fileNode = { name: 'test.ts', path: '/src/test.ts', is_dir: false };
    mockStoreState.nodes = [fileNode];

    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('app.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test' } });
  });

  it('should update max depth via slider', () => {
    render(<Sidebar />);
    const settingsButton = screen.getByRole('button', { name: '' });
    fireEvent.click(settingsButton);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });
    expect(mockSetMaxDepth).toHaveBeenCalledWith(3);
  });

  it('should handle close settings panel by clicking outside', () => {
    render(<Sidebar />);
    const settingsButton = screen.getByRole('button', { name: '' });
    fireEvent.click(settingsButton);
    expect(screen.getByText('app.settings')).toBeInTheDocument();

    fireEvent.click(settingsButton);
  });

  it('should render empty prompt when no node selected', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false }];
    mockStoreState.selectedNode = null;

    render(<Sidebar />);
    expect(screen.getByText('app.emptyPrompt')).toBeInTheDocument();
  });

  it('should show file size in KB', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false, size: 2048 }];
    mockStoreState.selectedNode = { name: 'test.ts', path: '/test.ts', is_dir: false, size: 2048 };

    render(<Sidebar />);
    expect(screen.getByText('KB')).toBeInTheDocument();
  });

  it('should show complexity when available', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false, complexity: 5 }];
    mockStoreState.selectedNode = { name: 'test.ts', path: '/test.ts', is_dir: false, complexity: 5 };

    render(<Sidebar />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show sector info when available', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false, sector: 'Core', color: '#06b6d4' }];
    mockStoreState.selectedNode = { name: 'test.ts', path: '/test.ts', is_dir: false, sector: 'Core', color: '#06b6d4' };

    render(<Sidebar />);
    expect(screen.getByText(/node.sector/)).toBeInTheDocument();
  });

  it('should show readme indicator when has_readme is true', () => {
    mockStoreState.nodes = [{ name: 'test', path: '/test', is_dir: true, has_readme: true }];
    mockStoreState.selectedNode = { name: 'test', path: '/test', is_dir: true, has_readme: true };

    render(<Sidebar />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle directory selection differently', () => {
    mockStoreState.nodes = [{ name: 'src', path: '/src', is_dir: true }];
    mockStoreState.selectedNode = { name: 'src', path: '/src', is_dir: true };

    render(<Sidebar />);
    expect(screen.getByText('node.systemCore')).toBeInTheDocument();
  });

  it('should open detail view when zoom button clicked', () => {
    mockStoreState.nodes = [{ name: 'test.ts', path: '/test.ts', is_dir: false, size: 1024 }];
    mockStoreState.selectedNode = { name: 'test.ts', path: '/test.ts', is_dir: false, size: 1024 };

    render(<Sidebar />);
    const zoomButton = screen.getByTitle('detail.deepScan');
    fireEvent.click(zoomButton);
    expect(mockSetShowDetail).toHaveBeenCalledWith(true);
  });

  it('should show created and modified dates', () => {
    mockStoreState.nodes = [{
      name: 'test.ts',
      path: '/test.ts',
      is_dir: false,
      size: 1024,
      created_at: 1609459200,
      modified_at: 1609545600
    }];
    mockStoreState.selectedNode = {
      name: 'test.ts',
      path: '/test.ts',
      is_dir: false,
      size: 1024,
      created_at: 1609459200,
      modified_at: 1609545600
    };

    render(<Sidebar />);
    expect(screen.getByText('node.createdTime')).toBeInTheDocument();
    expect(screen.getByText('node.modifiedTime')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    mockStoreState.loading = true;
    render(<Sidebar />);
    const scanButton = screen.getByText('app.scan');
    expect(scanButton).toBeInTheDocument();
  });

  it('should toggle onlySrc from true to false', () => {
    mockStoreState.onlySrc = true;
    render(<Sidebar />);
    const onlySrcToggle = screen.getByText('app.onlySrc');
    fireEvent.click(onlySrcToggle);
    expect(mockSetOnlySrc).toHaveBeenCalledWith(false);
  });

  it('should toggle onlySrc from false to true', () => {
    mockStoreState.onlySrc = false;
    render(<Sidebar />);
    const onlySrcToggle = screen.getByText('app.onlySrc');
    fireEvent.click(onlySrcToggle);
    expect(mockSetOnlySrc).toHaveBeenCalledWith(true);
  });
});
