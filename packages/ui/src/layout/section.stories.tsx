import type { Meta, StoryObj } from '@storybook/react';
import { Section } from './section';
import { Container } from './container';
import { Stack } from './stack';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
  args: {
    spacing: 'md',
    children: (
      <Container>
        <Stack gap="4">
          <h2 className="text-2xl font-semibold text-gray-900">Section Heading</h2>
          <p className="text-gray-600">Supporting copy for this section of the page.</p>
        </Stack>
      </Container>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Section>;

export const Default: Story = {};

export const Backgrounds: Story = {
  render: (args) => (
    <div className="space-y-6">
      <Section {...args} background="white" />
      <Section {...args} background="gray" />
      <Section {...args} background="primary" />
    </div>
  ),
};
