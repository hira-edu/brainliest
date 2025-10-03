import { describe, expect, it } from 'vitest';
import { ADMIN_NAV_SECTIONS, resolveAdminNavItems } from './navigation';

describe('resolveAdminNavItems', () => {
  it('marks exact matches as active', () => {
    const items = resolveAdminNavItems(ADMIN_NAV_SECTIONS, '/dashboard');
    const dashboard = items.find((item) => item.href === '/dashboard');

    expect(dashboard?.isActive).toBe(true);
  });

  it('does not activate exact routes for nested paths', () => {
    const items = resolveAdminNavItems(ADMIN_NAV_SECTIONS, '/dashboard/tools');
    const dashboard = items.find((item) => item.href === '/dashboard');

    expect(dashboard?.isActive).toBe(false);
  });

  it('activates nested routes for prefix matches', () => {
    const items = resolveAdminNavItems(ADMIN_NAV_SECTIONS, '/content/exams/new');
    const exams = items.find((item) => item.href === '/content/exams');

    expect(exams?.isActive).toBe(true);
  });

  it('normalizes trailing slashes for matches', () => {
    const items = resolveAdminNavItems(ADMIN_NAV_SECTIONS, '/integrations/keys/');
    const keys = items.find((item) => item.href === '/integrations/keys');

    expect(keys?.isActive).toBe(true);
  });
});
