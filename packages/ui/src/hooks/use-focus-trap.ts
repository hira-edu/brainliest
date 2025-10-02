import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = Array.from(
      element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    );

    if (focusableElements.length === 0) {
      element.focus();
      return;
    }

    const [firstElement] = focusableElements;
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    element.addEventListener('keydown', handleKeydown);
    firstElement?.focus({ preventScroll: true });

    return () => element.removeEventListener('keydown', handleKeydown);
  }, []);

  return ref;
}
