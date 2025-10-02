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

if (typeof window !== 'undefined') {
  const pointerCaptureMap = new WeakMap<EventTarget, Set<number>>();

  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = function setPointerCapture(pointerId: number) {
      const existing = pointerCaptureMap.get(this) ?? new Set<number>();
      existing.add(pointerId);
      pointerCaptureMap.set(this, existing);
    };
  }

  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = function releasePointerCapture(pointerId: number) {
      const existing = pointerCaptureMap.get(this);
      if (existing) {
        existing.delete(pointerId);
      }
    };
  }

  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = function hasPointerCapture(pointerId: number) {
      const existing = pointerCaptureMap.get(this);
      return existing?.has(pointerId) ?? false;
    };
  }
}
