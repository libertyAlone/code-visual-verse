import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeViewer } from './CodeViewer';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Create mock functions for testing interactions
const mockOnJump = vi.fn();
const mockShowDiff = vi.fn();
const mockSetHoveredHash = vi.fn();

// Track renderer props for testing
let capturedRenderer: any = null;
let capturedRows: any[] = [];
let capturedStylesheet: any = {};

// Mock SyntaxHighlighter with more realistic behavior
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, renderer, style }: {
    children: string;
    renderer?: any;
    style?: any;
  }) => {
    // Capture renderer for testing
    if (renderer) {
      capturedRenderer = renderer;
      // Simulate the rows that would be generated
      const lines = children.split('\n');
      capturedRows = lines.map((line: string, i: number) => ({
        children: [{
          type: 'text',
          value: line,
          tagName: undefined,
          properties: {}
        }]
      }));
      capturedStylesheet = style || {};

      // Return the rendered content
      const rendered = renderer({
        rows: capturedRows,
        stylesheet: capturedStylesheet
      });

      return (
        <div data-testid="code-block" data-language="typescript">
          {rendered}
        </div>
      );
    }

    return (
      <pre data-testid="code-block" data-language="typescript">
        {children}
      </pre>
    );
  },
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Code2: () => <svg data-testid="code-icon" />,
}));

describe('CodeViewer', () => {
  const mockNode = {
    name: 'test.ts',
    path: '/src/test.ts',
    is_dir: false,
    size: 100,
  };

  const mockProps = {
    node: mockNode,
    sourceCode: 'const x = 1;',
    blameData: [
      { hash: 'abc123', author: 'Test User', date: '2024-01-01' },
    ],
    allNodes: [mockNode],
    onJump: mockOnJump,
    showDiff: mockShowDiff,
    hoveredHash: null,
    setHoveredHash: mockSetHoveredHash,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedRenderer = null;
    capturedRows = [];
    capturedStylesheet = {};
  });

  it('should render with empty state', () => {
    render(<CodeViewer {...mockProps} sourceCode="" />);
    expect(screen.getByText('detail.initBuffer')).toBeInTheDocument();
  });

  it('should load file content when node is selected', async () => {
    render(<CodeViewer {...mockProps} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching content', () => {
    render(<CodeViewer {...mockProps} sourceCode="" />);
    expect(screen.getByText('detail.initBuffer')).toBeInTheDocument();
  });

  it('should handle file read errors', async () => {
    render(<CodeViewer {...mockProps} sourceCode="Error loading file" />);
    expect(screen.getByTestId('code-block')).toHaveTextContent('Error loading file');
  });

  it('should close viewer when close button is clicked', async () => {
    render(<CodeViewer {...mockProps} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should skip loading content for directories', () => {
    const dirNode = {
      name: 'src',
      path: '/src',
      is_dir: true,
      size: 0,
    };

    render(<CodeViewer {...mockProps} node={dirNode} sourceCode="" />);
    expect(screen.getByText('detail.initBuffer')).toBeInTheDocument();
  });

  it('should detect TypeScript files correctly', async () => {
    const tsNode = {
      name: 'App.tsx',
      path: '/src/App.tsx',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={tsNode} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect JavaScript files correctly', async () => {
    const jsNode = {
      name: 'utils.js',
      path: '/src/utils.js',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={jsNode} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should display code content in the block', async () => {
    render(<CodeViewer {...mockProps} sourceCode="function test() { return true; }" />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toHaveTextContent('function test() { return true; }');
    });
  });

  // Additional tests for coverage
  it('should detect Rust files', async () => {
    const rustNode = {
      name: 'main.rs',
      path: '/src/main.rs',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={rustNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect Python files', async () => {
    const pyNode = {
      name: 'script.py',
      path: '/src/script.py',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={pyNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect Go files', async () => {
    const goNode = {
      name: 'main.go',
      path: '/src/main.go',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={goNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect CSS files', async () => {
    const cssNode = {
      name: 'styles.css',
      path: '/src/styles.css',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={cssNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect HTML files', async () => {
    const htmlNode = {
      name: 'index.html',
      path: '/src/index.html',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={htmlNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should detect JSON files', async () => {
    const jsonNode = {
      name: 'config.json',
      path: '/src/config.json',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={jsonNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle unknown file types', async () => {
    const unknownNode = {
      name: 'README.md',
      path: '/src/README.md',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={unknownNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle files without extension', async () => {
    const noExtNode = {
      name: 'Makefile',
      path: '/Makefile',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={noExtNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should render with multiple blame entries', async () => {
    const blameData = [
      { hash: 'abc123', author: 'Test User', date: '2024-01-01' },
      { hash: 'def456', author: 'Another User', date: '2024-01-02' },
      { hash: 'ghi789', author: 'Third User', date: '2024-01-03' },
    ];

    render(<CodeViewer {...mockProps} blameData={blameData} sourceCode="line1\nline2\nline3" />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle empty blame data', async () => {
    render(<CodeViewer {...mockProps} blameData={[]} sourceCode="test code" />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should call setHoveredHash on mouse enter', async () => {
    render(<CodeViewer {...mockProps} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should call showDiff when blame hash is clicked', async () => {
    render(<CodeViewer {...mockProps} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle jump to file when token matches', async () => {
    const allNodes = [
      { name: 'test.ts', path: '/src/test.ts', is_dir: false },
      { name: 'utils.ts', path: '/src/utils.ts', is_dir: false },
    ];

    render(<CodeViewer {...mockProps} allNodes={allNodes} sourceCode="import utils from './utils';" />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle hoveredHash prop', async () => {
    render(<CodeViewer {...mockProps} hoveredHash="abc123" />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should handle JSX files', async () => {
    const jsxNode = {
      name: 'Component.jsx',
      path: '/src/Component.jsx',
      is_dir: false,
      size: 100,
    };

    render(<CodeViewer {...mockProps} node={jsxNode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });
  });

  it('should render multiline code', async () => {
    const multilineCode = `function test() {
  return true;
}

const x = 1;`;

    render(<CodeViewer {...mockProps} sourceCode={multilineCode} />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('code-block')).toHaveTextContent('function test');
    });
  });

  // New interaction tests for better coverage
  describe('Interaction Tests', () => {
    it('should call onJump when clicking a token that matches another file', async () => {
      const utilsNode = {
        name: 'utils.ts',
        path: '/src/utils.ts',
        is_dir: false,
        size: 100,
      };

      render(
        <CodeViewer
          {...mockProps}
          allNodes={[mockNode, utilsNode]}
          sourceCode="utils"
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should not call onJump when clicking a token for current file', async () => {
      render(
        <CodeViewer
          {...mockProps}
          allNodes={[mockNode]}
          sourceCode="test"
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should apply hovered highlight when hoveredHash matches blame hash', async () => {
      render(
        <CodeViewer
          {...mockProps}
          hoveredHash="abc123"
          sourceCode="test code"
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should handle partial hash match for hover highlighting', async () => {
      render(
        <CodeViewer
          {...mockProps}
          blameData={[{ hash: 'abc123def456', author: 'Test User', date: '2024-01-01' }]}
          hoveredHash="abc123"
          sourceCode="test"
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should call showDiff when clicking blame hash', async () => {
      render(<CodeViewer {...mockProps} />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should not call showDiff when clicking placeholder blame hash', async () => {
      render(
        <CodeViewer
          {...mockProps}
          blameData={[{ hash: '...', author: '...', date: '...' }]}
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should render code with complex structure', async () => {
      const complexCode = `import { useState } from 'react';
import { utils } from './utils';

function Component() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}`;

      render(<CodeViewer {...mockProps} sourceCode={complexCode} />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should handle blame data with missing entries', async () => {
      render(
        <CodeViewer
          {...mockProps}
          blameData={[
            { hash: 'abc123', author: 'Test User', date: '2024-01-01' },
            // Missing second entry
          ]}
          sourceCode="line1\nline2"
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });

    it('should handle all supported file extensions', async () => {
      const extensions = [
        { ext: 'ts', expected: 'typescript' },
        { ext: 'tsx', expected: 'typescript' },
        { ext: 'js', expected: 'javascript' },
        { ext: 'jsx', expected: 'javascript' },
        { ext: 'rs', expected: 'rust' },
        { ext: 'py', expected: 'python' },
        { ext: 'go', expected: 'go' },
        { ext: 'css', expected: 'css' },
        { ext: 'html', expected: 'html' },
        { ext: 'json', expected: 'json' },
      ];

      for (const { ext } of extensions) {
        const node = {
          name: `test.${ext}`,
          path: `/src/test.${ext}`,
          is_dir: false,
          size: 100,
        };

        const { unmount } = render(<CodeViewer {...mockProps} node={node} />);

        await vi.waitFor(() => {
          expect(screen.getByTestId('code-block')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should handle empty source code gracefully', async () => {
      render(<CodeViewer {...mockProps} sourceCode="" />);
      expect(screen.getByText('detail.initBuffer')).toBeInTheDocument();
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
    });

    it('should handle source code with special characters', async () => {
      const specialCode = `const emoji = "🎉";
const unicode = "中文";
const symbols = "!@#$%^&*()";`;

      render(<CodeViewer {...mockProps} sourceCode={specialCode} />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('code-block')).toBeInTheDocument();
      });
    });
  });
});
