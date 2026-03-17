import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';

// Mock useStore
const mockSetIsTouring = vi.fn();
const mockSetTourIndex = vi.fn();
const mockSetShowAllDependencies = vi.fn();

// Create a mock store state that can be modified
let mockStoreState: any = {
  isTouring: false,
  setIsTouring: mockSetIsTouring,
  setTourIndex: mockSetTourIndex,
  showAllDependencies: false,
  setShowAllDependencies: mockSetShowAllDependencies,
};

vi.mock('../../store/useStore', () => ({
  useStore: () => mockStoreState,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe('ControlPanel', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state to default
    mockStoreState = {
      isTouring: false,
      setIsTouring: mockSetIsTouring,
      setTourIndex: mockSetTourIndex,
      showAllDependencies: false,
      setShowAllDependencies: mockSetShowAllDependencies,
    };
  });

  it('should render control panel', () => {
    render(<ControlPanel onReset={mockOnReset} />);
    expect(screen.getByText('node.linkages: HIDDEN')).toBeInTheDocument();
  });

  it('should display tour button when not touring', () => {
    render(<ControlPanel onReset={mockOnReset} />);
    expect(screen.getByText('universe.tour')).toBeInTheDocument();
  });

  it('should display touring button when touring', () => {
    mockStoreState.isTouring = true;

    render(<ControlPanel onReset={mockOnReset} />);
    expect(screen.getByText('universe.touring')).toBeInTheDocument();
  });

  it('should toggle tour mode when tour button is clicked', () => {
    render(<ControlPanel onReset={mockOnReset} />);

    const tourButton = screen.getByText('universe.tour');
    fireEvent.click(tourButton);

    expect(mockSetIsTouring).toHaveBeenCalledWith(true);
    expect(mockSetTourIndex).toHaveBeenCalledWith(0);
  });

  it('should stop tour mode when touring and button is clicked', () => {
    mockStoreState.isTouring = true;

    render(<ControlPanel onReset={mockOnReset} />);

    const tourButton = screen.getByText('universe.touring');
    fireEvent.click(tourButton);

    expect(mockSetIsTouring).toHaveBeenCalledWith(false);
  });

  it('should call onReset when home button is clicked', () => {
    render(<ControlPanel onReset={mockOnReset} />);

    const homeButton = screen.getByText('app.returnHome');
    fireEvent.click(homeButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it('should toggle dependencies visibility', () => {
    render(<ControlPanel onReset={mockOnReset} />);

    const depsButton = screen.getByText('node.linkages: HIDDEN');
    fireEvent.click(depsButton);

    expect(mockSetShowAllDependencies).toHaveBeenCalledWith(true);
  });

  it('should show active dependencies state', () => {
    mockStoreState.showAllDependencies = true;

    render(<ControlPanel onReset={mockOnReset} />);
    expect(screen.getByText('node.linkages: ACTIVE')).toBeInTheDocument();
  });

  it('should have correct CSS classes for positioning', () => {
    render(<ControlPanel onReset={mockOnReset} />);
    // Find the container div that has the positioning classes
    const linkagesButton = screen.getByText('node.linkages: HIDDEN');
    const container = linkagesButton.closest('.absolute.top-10.right-10');
    expect(container).toBeInTheDocument();
  });

  it('should render home button', () => {
    render(<ControlPanel onReset={mockOnReset} />);
    expect(screen.getByText('app.returnHome')).toBeInTheDocument();
  });
});
