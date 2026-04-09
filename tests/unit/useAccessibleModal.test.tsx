import { jest } from "@jest/globals";
import { renderHook } from '@testing-library/react';
import { useAccessibleModal } from '../../src/hooks/useAccessibleModal';
import { useRef } from 'react';

describe('useAccessibleModal', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let onClose: jest.Mock;

  beforeEach(() => {
    // Reset body overflow and active element
    document.body.style.overflow = '';
    document.body.innerHTML = '';
    onClose = jest.fn();

    container = document.createElement('div');
    button1 = document.createElement('button');
    button2 = document.createElement('button');

    button1.textContent = 'Button 1';
    button2.textContent = 'Button 2';

    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when isOpen is false', () => {
    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: false, onClose, containerRef });
    });

    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(document.body);
  });

  it('hides overflow and focuses first focusable element when isOpen is true', () => {
    jest.useFakeTimers();

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    expect(document.body.style.overflow).toBe('hidden');

    // Fast-forward setTimeout(..., 0)
    jest.runAllTimers();

    expect(document.activeElement).toBe(button1);
  });

  it('focuses initialFocusRef if provided', () => {
    jest.useFakeTimers();

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      const initialFocusRef = useRef<HTMLButtonElement>(button2);
      useAccessibleModal({ isOpen: true, onClose, containerRef, initialFocusRef });
    });

    jest.runAllTimers();

    expect(document.activeElement).toBe(button2);
  });

  it('calls onClose when Escape is pressed', () => {
    jest.useFakeTimers();

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    jest.runAllTimers();

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores previous active element and overflow on unmount', () => {
    jest.useFakeTimers();
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const outerButton = document.createElement('button');
    document.body.appendChild(outerButton);
    outerButton.focus();
    expect(document.activeElement).toBe(outerButton);

    const { unmount } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    jest.runAllTimers();
    expect(document.activeElement).toBe(button1);
    expect(document.body.style.overflow).toBe('hidden');

    const keydownHandler = addEventListenerSpy.mock.calls.find(([type]) => type === 'keydown')?.[1];
    expect(keydownHandler).toEqual(expect.any(Function));

    unmount();

    expect(document.activeElement).toBe(outerButton);
    expect(document.body.style.overflow).toBe('');
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', keydownHandler);
  });

  it('traps focus to container when no focusable elements are present', () => {
    jest.useFakeTimers();

    // Remove buttons to have an empty container
    container.innerHTML = '';
    // Make container focusable so we can verify it gets focus
    container.tabIndex = -1;

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    jest.runAllTimers();

    // Initial focus on container since no focusable elements
    expect(document.activeElement).toBe(container);

    // Press Tab
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(event);

    // Focus remains on container
    expect(document.activeElement).toBe(container);
  });

  it('wraps focus to first element when Tab is pressed on last element', () => {
    jest.useFakeTimers();

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    jest.runAllTimers();
    expect(document.activeElement).toBe(button1);

    // Manually focus the last element
    button2.focus();
    expect(document.activeElement).toBe(button2);

    // Press Tab
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(event);

    // Should wrap to first element
    expect(document.activeElement).toBe(button1);
  });

  it('wraps focus to last element when Shift+Tab is pressed on first element', () => {
    jest.useFakeTimers();

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(container);
      useAccessibleModal({ isOpen: true, onClose, containerRef });
    });

    jest.runAllTimers();
    expect(document.activeElement).toBe(button1);

    // Press Shift+Tab
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    document.dispatchEvent(event);

    // Should wrap to last element
    expect(document.activeElement).toBe(button2);
  });
});
