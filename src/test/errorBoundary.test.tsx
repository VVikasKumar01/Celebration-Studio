import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const FaultyComponent = () => {
  throw new Error('Test intentional rendering failure');
};

const SafeComponent = () => <div>Safe Celebration Content</div>;

describe('ErrorBoundary Resilience Component', () => {
  it('renders children smoothly when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe Celebration Content')).toBeInTheDocument();
  });

  it('catches render exceptions and renders friendly peace-of-mind recovery UI', () => {
    // Suppress console.error during expected boundary catch
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Celebration Studio Encountered a Hiccup')).toBeInTheDocument();
    expect(screen.getByText('Reload Celebration Workspace')).toBeInTheDocument();
    expect(screen.getByText('Restore Sample Blueprint')).toBeInTheDocument();

    spy.mockRestore();
  });
});
