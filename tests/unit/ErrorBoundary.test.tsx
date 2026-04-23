import { render, screen } from '@testing-library/react';
import React from 'react';
import { jest } from '@jest/globals';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Secret API Key: 12345');
};

describe('ErrorBoundary Security', () => {
  it('does not render raw error message to the user interface', () => {
    // Suppress console.error in test output since we expect an error boundary catch
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Secret API Key: 12345/)).not.toBeInTheDocument();
    expect(screen.getByText(/Verifique o console para mais detalhes ou contate o suporte/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
