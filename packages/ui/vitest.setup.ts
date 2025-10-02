import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend({ toHaveNoViolations });

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // @ts-expect-error add minimal mock for jsdom environment
  window.ResizeObserver = ResizeObserverStub;
  // @ts-expect-error keep global in sync
  global.ResizeObserver = ResizeObserverStub;
}

if (typeof window !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  // @ts-expect-error jsdom types allow assignment
  HTMLElement.prototype.scrollIntoView = () => {};
}
