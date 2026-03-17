import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeHUD } from './WelcomeHUD';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.welcome.title': 'Welcome to Code Visual Verse',
        'app.welcome.subtitle': 'Visualize your codebase in 3D',
        'welcome.guide_ready': 'Guide Ready',
        'app.welcome.feature.mapping': 'Code to Universe Mapping',
        'app.welcome.feature.telemetry': 'Real-time Telemetry',
        'app.welcome.feature.navigation': 'Intuitive Navigation',
        'app.welcome.feature.ai': 'AI Assistance',
        'app.welcome.feature.diagnostics': 'Heatmap Diagnostics',
        'app.welcome.controls.title': 'Controls',
        'app.welcome.controls.rotate': 'Rotate',
        'app.welcome.controls.pan': 'Pan',
        'app.welcome.controls.zoom': 'Zoom',
        'app.welcome.controls.select': 'Select',
        'welcome.controls.rotate_key': 'Left Click',
        'welcome.controls.pan_key': 'Right Click',
        'welcome.controls.zoom_key': 'Scroll',
        'welcome.controls.select_key': 'Click',
        'app.welcome.import_guide': 'Import Project to Begin',
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
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WelcomeHUD', () => {
  it('should render welcome title', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Welcome to Code Visual Verse')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Visualize your codebase in 3D')).toBeInTheDocument();
  });

  it('should render guide ready badge', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Guide Ready')).toBeInTheDocument();
  });

  it('should render features', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Code to Universe Mapping')).toBeInTheDocument();
    expect(screen.getByText('Real-time Telemetry')).toBeInTheDocument();
    expect(screen.getByText('AI Assistance')).toBeInTheDocument();
    expect(screen.getByText('Heatmap Diagnostics')).toBeInTheDocument();
  });

  it('should render controls section', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Rotate')).toBeInTheDocument();
    expect(screen.getByText('Pan')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('should render keyboard shortcuts', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Left Click')).toBeInTheDocument();
    expect(screen.getByText('Right Click')).toBeInTheDocument();
    expect(screen.getByText('Scroll')).toBeInTheDocument();
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('should render import guide prompt', () => {
    render(<WelcomeHUD />);
    expect(screen.getByText('Import Project to Begin')).toBeInTheDocument();
  });
});
