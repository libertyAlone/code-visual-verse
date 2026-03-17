# Code Visual Verse - Testing Guide

This document describes how to run the various tests for the Code Visual Verse project.

## Frontend Tests (Vitest)

### Running Tests

```bash
# Run tests in watch mode (recommended during development)
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Test Structure

```
src/
├── test/
│   ├── setup.ts           # Test setup and global mocks
│   ├── test-utils.tsx     # Test utilities and helpers
│   └── integration.test.ts # Integration tests
├── store/
│   └── useStore.test.ts   # Store unit tests
├── lib/
│   ├── ast-processor.test.ts  # AST processor tests
│   └── aiService.test.ts      # AI service tests
├── hooks/
│   ├── useProject.test.ts     # Project hook tests
│   └── useAppEvents.test.ts   # App events hook tests
└── components/
    ├── ui/
    │   ├── ControlPanel.test.tsx  # Control panel tests
    │   └── Sidebar.test.tsx       # Sidebar tests
    └── universe/
        └── WelcomeHUD.test.tsx    # Welcome HUD tests
```

## Backend Tests (Rust)

### Running Tests

```bash
# Run all Rust tests
cargo test --manifest-path src-tauri/Cargo.toml

# Or using the npm script
pnpm test:rust

# Run specific test
cargo test --manifest-path src-tauri/Cargo.toml test_project_file_creation

# Run tests with output
cargo test --manifest-path src-tauri/Cargo.toml -- --nocapture
```

### Test Structure

```
src-tauri/
├── src/
│   ├── commands.rs           # Main commands module
│   └── commands_test.rs      # Unit tests for commands
└── tests/
    └── integration_tests.rs  # Integration tests
```

## Writing New Tests

### Frontend Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Frontend Integration Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Integration: Feature Name', () => {
  it('should complete full workflow', async () => {
    // Test the complete workflow
  });
});
```

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        assert_eq!(expected, actual);
    }
}
```

## Coverage Reports

Frontend coverage reports are generated in the `coverage/` directory after running `pnpm test:coverage`.

Open `coverage/index.html` in a browser to view the detailed coverage report.

## CI/CD Integration

The test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Frontend Tests
  run: pnpm test:run

- name: Run Rust Tests
  run: cargo test --manifest-path src-tauri/Cargo.toml
```

## Test Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:ui` | Run tests with UI |
| `pnpm test:rust` | Run Rust tests |
| `cargo test` | Run all Rust tests |
| `cargo test test_name` | Run specific Rust test |
