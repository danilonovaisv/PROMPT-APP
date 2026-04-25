import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToast, ToastProvider } from '@/context/ToastContext';

function ToastHarness() {
  const { showToast } = useToast();

  return (
    <button type="button" onClick={() => showToast('Toast de auditoria', 'info')}>
      Mostrar toast
    </button>
  );
}

describe('ToastProvider cleanup characterization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('removes the toast after the auto-dismiss delay while mounted', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar toast' }));
    expect(screen.getByText('Toast de auditoria')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Toast de auditoria')).not.toBeInTheDocument();
  });

  // Characterization test: documents the current missing unmount cleanup.
  test('documents missing cleanup: auto-dismiss timer remains scheduled after provider unmount', () => {
    const { unmount } = render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar toast' }));
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(1);
  });
});
