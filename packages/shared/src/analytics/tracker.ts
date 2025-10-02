import type { BaseEvent } from './events';

export type AnalyticsPersister = (event: BaseEvent) => Promise<void>;

let persister: AnalyticsPersister | null = null;

export function configureAnalyticsPersister(nextPersister: AnalyticsPersister) {
  persister = nextPersister;
}

export async function track(event: BaseEvent): Promise<void> {
  if (typeof window !== 'undefined' && typeof (window as typeof window & { va?: (eventName: string, payload: unknown) => void }).va === 'function') {
    (window as typeof window & { va?: (eventName: string, payload: unknown) => void }).va?.('event', {
      name: event.eventName,
      data: event.properties,
    });
  }

  if (persister) {
    await persister(event);
  }
}
