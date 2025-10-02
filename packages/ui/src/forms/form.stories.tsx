import type { Meta, StoryObj } from '@storybook/react';
import { Form } from './form';
import { FormSection } from './form-section';
import { FormField } from './form-field';
import { Input } from '../primitives/input';
import { Textarea } from '../primitives/textarea';
import { Button } from '../primitives/button';

const meta: Meta<typeof Form> = {
  title: 'Forms/Form',
  component: Form,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Form>;

export const Basic: Story = {
  render: (args) => (
    <Form {...args} onSubmit={(event) => event.preventDefault()}>
      <FormSection
        title="Profile information"
        description="Share details that will appear on your public profile."
      >
        <FormField label="Full name" required>
          <Input placeholder="Jane Doe" />
        </FormField>
        <FormField label="Bio" description="Tell the community about yourself.">
          <Textarea placeholder="I love learning new things." rows={4} />
        </FormField>
      </FormSection>
      <div className="flex justify-end">
        <Button type="submit">Save changes</Button>
      </div>
    </Form>
  ),
};
