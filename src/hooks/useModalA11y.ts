import { useEffect, useRef } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  autoFocusSelector?: string;
}

/**
 * Accessible modal hook:
 * - Traps keyboard focus inside the dialog when Tab / Shift+Tab is pressed
 * - Dismisses dialog on Escape key
 * - Restores focus to the triggering element when the modal closes
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  autoFocusSelector,
}: UseModalA11yOptions) {
  const modalRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember currently focused element to return focus on close
    triggerRef.current = document.activeElement as HTMLElement;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Focus initial element
    const focusTarget = autoFocusSelector
      ? modalElement.querySelector<HTMLElement>(autoFocusSelector)
      : modalElement.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

    if (focusTarget) {
      setTimeout(() => focusTarget.focus(), 50);
    }

    // Keydown handler for Escape and Tab trapping
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, autoFocusSelector]);

  return modalRef;
}
