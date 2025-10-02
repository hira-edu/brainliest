import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './footer';

const meta: Meta<typeof Footer> = {
  title: 'Navigation/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    brand: (
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Brainliest</h3>
        <p className="text-sm text-gray-600">AI-powered exam preparation for ambitious learners.</p>
      </div>
    ),
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Roadmap', href: '#roadmap' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '#about' },
          { label: 'Careers', href: '#careers' },
          { label: 'Contact', href: '#contact' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Blog', href: '#blog' },
          { label: 'Help Center', href: '#help' },
          { label: 'Status', href: '#status' },
        ],
      },
    ],
    bottom: (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Brainliest. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-gray-900">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-gray-900">
            Terms of Service
          </a>
        </div>
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
