import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PracticeCourseNavigation } from './practice-course-navigation';

describe('PracticeCourseNavigation', () => {
  it('renders sidebar header and menu items', () => {
    render(
      <PracticeCourseNavigation
        courseLabel="Algebra II"
        collectionLabel="Midterm prep"
        sidebarItems={[
          { label: 'Assignments', href: '#assignments' },
          { label: 'Bookmarks', href: '#bookmarks', badge: 14 },
        ]}
        menuItems={[
          { label: 'Overview', href: '#overview', isActive: true },
          { label: 'Practice', href: '#practice' },
        ]}
      />
    );

    expect(screen.getByText('Algebra II')).toBeInTheDocument();
    expect(screen.getByText('Midterm prep')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Course navigation' })).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
