import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitLogsView } from './GitLogsView';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'detail.gitLog': 'Git Log',
        'detail.noRepo': 'No Repository',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('GitLogsView', () => {
  const mockSetHoveredHash = vi.fn();
  const mockShowDiff = vi.fn();

  it('should render empty state when no commits', () => {
    render(
      <GitLogsView
        logs={[]}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );
    expect(screen.getByText('No Repository')).toBeInTheDocument();
  });

  it('should render commits list', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User1', date: '2 days ago', message: 'Fix bug', branches: 'main' },
      { hash: 'def456abc', author: 'User2', date: '1 week ago', message: 'Add feature', branches: '' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    expect(screen.getByText('#abc123de')).toBeInTheDocument();
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
    expect(screen.getByText('Add feature')).toBeInTheDocument();
  });

  it('should call showDiff when commit is clicked', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User1', date: '2 days ago', message: 'Fix bug', branches: 'main' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    const commitRow = screen.getByText('Fix bug');
    fireEvent.click(commitRow);

    expect(mockShowDiff).toHaveBeenCalledWith('abc123def');
  });

  it('should call setHoveredHash on mouse enter', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User1', date: '2 days ago', message: 'Fix bug', branches: 'main' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    const commitRow = screen.getByText('Fix bug');
    fireEvent.mouseEnter(commitRow);

    expect(mockSetHoveredHash).toHaveBeenCalledWith('abc123def');
  });

  it('should call setHoveredHash with null on mouse leave', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User1', date: '2 days ago', message: 'Fix bug', branches: 'main' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    const commitRow = screen.getByText('Fix bug');
    fireEvent.mouseLeave(commitRow);

    expect(mockSetHoveredHash).toHaveBeenCalledWith(null);
  });

  it('should display author and date', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'Test Author', date: '3 days ago', message: 'Update', branches: '' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('should show branch information', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User', date: '1 day ago', message: 'Commit', branches: 'main' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should show commit count', () => {
    const mockCommits = [
      { hash: 'abc123def', author: 'User1', date: '1 day ago', message: 'Commit 1', branches: '' },
      { hash: 'def456abc', author: 'User2', date: '2 days ago', message: 'Commit 2', branches: '' },
    ];

    render(
      <GitLogsView
        logs={mockCommits}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render Git Log title', () => {
    render(
      <GitLogsView
        logs={[]}
        hoveredHash={null}
        setHoveredHash={mockSetHoveredHash}
        showDiff={mockShowDiff}
      />
    );

    expect(screen.getByText('Git Log')).toBeInTheDocument();
  });
});
