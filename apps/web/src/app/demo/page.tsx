'use client';

import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Avatar,
  Spinner,
  Link,
  Container,
  Grid,
  Stack,
  Divider,
  Card,
  Section,
  Alert,
  Progress,
  Skeleton,
  EmptyState,
  Modal,
  useDisclosure,
} from '@brainliest/ui';
import { useState } from 'react';

export default function DemoPage() {
  const [inputValue, setInputValue] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const modalDisclosure = useDisclosure();

  return (
    <Container maxWidth="2xl" className="py-12">
      <Stack gap={8}>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Brainliest UI Component Library
          </h1>
          <p className="text-lg text-gray-600">
            Fully responsive, accessible React components built with Tailwind CSS
          </p>
        </div>

        <Divider />

        {/* Primitives Section */}
        <Section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Primitive Components</h2>

          {/* Buttons */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Buttons</h3>
            <Stack direction="row" gap={4} className="flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </Stack>

            <Divider spacing="md" />

            <h4 className="text-lg font-medium mb-3">Button Sizes</h4>
            <Stack direction="row" gap={4} align="center" className="flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Stack>

            <Divider spacing="md" />

            <h4 className="text-lg font-medium mb-3">Button States</h4>
            <Stack direction="row" gap={4} className="flex-wrap">
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button leftIcon={<span>←</span>}>With Left Icon</Button>
              <Button rightIcon={<span>→</span>}>With Right Icon</Button>
            </Stack>
          </Card>

          {/* Form Inputs */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Form Inputs</h3>

            <Stack gap={4}>
              <div>
                <label className="block text-sm font-medium mb-2">Input</label>
                <Input
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Input with Icon</label>
                <Input
                  placeholder="Search..."
                  leftAddon={<span>🔍</span>}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Textarea</label>
                <Textarea placeholder="Enter description..." rows={4} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select</label>
                <Select>
                  <option>Choose an option</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                </Select>
              </div>
            </Stack>
          </Card>

          {/* Checkboxes & Radios */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Checkboxes & Radio Buttons</h3>

            <Stack gap={4}>
              <div>
                <h4 className="text-lg font-medium mb-3">Checkboxes</h4>
                <Stack gap={3}>
                  <Checkbox
                    label="Accept terms and conditions"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                  />
                  <Checkbox label="Subscribe to newsletter" description="Get updates via email" />
                  <Checkbox label="Disabled option" disabled />
                </Stack>
              </div>

              <Divider spacing="md" />

              <div>
                <h4 className="text-lg font-medium mb-3">Radio Buttons</h4>
                <Stack gap={3}>
                  <Radio name="plan" label="Free Plan" value="free" />
                  <Radio name="plan" label="Pro Plan" value="pro" />
                  <Radio name="plan" label="Enterprise Plan" value="enterprise" />
                </Stack>
              </div>

              <Divider spacing="md" />

              <div>
                <h4 className="text-lg font-medium mb-3">Switches</h4>
                <Stack gap={3}>
                  <Switch
                    label="Enable notifications"
                    checked={isSwitchOn}
                    onChange={(e) => setIsSwitchOn(e.target.checked)}
                  />
                  <Switch label="Dark mode" description="Toggle dark mode" />
                </Stack>
              </div>
            </Stack>
          </Card>

          {/* Badges & Avatars */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Badges & Avatars</h3>

            <Stack gap={6}>
              <div>
                <h4 className="text-lg font-medium mb-3">Badges</h4>
                <Stack direction="row" gap={3} className="flex-wrap">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="primary" dot>With Dot</Badge>
                </Stack>
              </div>

              <Divider spacing="md" />

              <div>
                <h4 className="text-lg font-medium mb-3">Avatars</h4>
                <Stack direction="row" gap={3} align="center" className="flex-wrap">
                  <Avatar size="xs" fallback="XS" />
                  <Avatar size="sm" fallback="SM" />
                  <Avatar size="md" fallback="MD" />
                  <Avatar size="lg" fallback="LG" />
                  <Avatar size="xl" fallback="XL" />
                </Stack>
              </div>
            </Stack>
          </Card>

          {/* Spinner & Link */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Spinner & Links</h3>

            <Stack gap={6}>
              <div>
                <h4 className="text-lg font-medium mb-3">Spinners</h4>
                <Stack direction="row" gap={4} align="center" className="flex-wrap">
                  <Spinner size="xs" />
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <Spinner size="xl" />
                </Stack>
              </div>

              <Divider spacing="md" />

              <div>
                <h4 className="text-lg font-medium mb-3">Links</h4>
                <Stack gap={3}>
                  <Link href="#" variant="default">Default Link</Link>
                  <Link href="#" variant="muted">Muted Link</Link>
                  <Link href="#" variant="subtle">Subtle Link</Link>
                </Stack>
              </div>
            </Stack>
          </Card>
        </Section>

        <Divider />

        {/* Layout Section */}
        <Section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Layout Components</h2>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Grid</h3>
            <Grid cols={3} gap={4}>
              <Card variant="outlined" padding="sm">
                <p className="text-center">Grid Item 1</p>
              </Card>
              <Card variant="outlined" padding="sm">
                <p className="text-center">Grid Item 2</p>
              </Card>
              <Card variant="outlined" padding="sm">
                <p className="text-center">Grid Item 3</p>
              </Card>
            </Grid>
          </Card>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Stack</h3>
            <Stack gap={3}>
              <Card variant="outlined" padding="sm">Stack Item 1</Card>
              <Card variant="outlined" padding="sm">Stack Item 2</Card>
              <Card variant="outlined" padding="sm">Stack Item 3</Card>
            </Stack>
          </Card>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Card Variants</h3>
            <Grid cols={3} gap={4}>
              <Card variant="default" padding="md">
                <h4 className="font-semibold mb-2">Default Card</h4>
                <p className="text-sm text-gray-600">Standard card with border</p>
              </Card>
              <Card variant="outlined" padding="md">
                <h4 className="font-semibold mb-2">Outlined Card</h4>
                <p className="text-sm text-gray-600">Card with thick border</p>
              </Card>
              <Card variant="elevated" padding="md">
                <h4 className="font-semibold mb-2">Elevated Card</h4>
                <p className="text-sm text-gray-600">Card with shadow</p>
              </Card>
            </Grid>
          </Card>
        </Section>

        <Divider />

        {/* Feedback Section */}
        <Section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Feedback Components</h2>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Alerts</h3>
            <Stack gap={4}>
              <Alert variant="default" title="Default Alert" description="This is a default alert message" />
              <Alert variant="info" title="Info Alert" description="This is an informational message" />
              <Alert variant="success" title="Success Alert" description="Your action was completed successfully" />
              <Alert variant="warning" title="Warning Alert" description="Please be aware of this warning" />
              <Alert variant="error" title="Error Alert" description="An error occurred, please try again" />
            </Stack>
          </Card>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Progress Bars</h3>
            <Stack gap={4}>
              <div>
                <p className="text-sm font-medium mb-2">Default Progress (45%)</p>
                <Progress value={45} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Success Progress (75%)</p>
                <Progress value={75} variant="success" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Warning Progress (50%)</p>
                <Progress value={50} variant="warning" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Error Progress (25%)</p>
                <Progress value={25} variant="error" />
              </div>
            </Stack>
          </Card>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Skeletons</h3>
            <Stack gap={3}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Stack direction="row" gap={3}>
                <Skeleton variant="circular" className="h-12 w-12" />
                <Stack gap={2} className="flex-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Empty State</h3>
            <EmptyState
              title="No data found"
              description="There are no items to display at the moment. Try creating a new one."
              icon={<div className="text-6xl">📭</div>}
              action={<Button>Create New Item</Button>}
            />
          </Card>
        </Section>

        {/* Composite Components Section */}
        <Divider />

        <Section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Composite Components</h2>

          {/* Modal */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Modal</h3>
            <p className="text-gray-600 mb-4">
              Interactive modal dialogs with Headless UI. Visit dedicated demo routes for full examples:
            </p>
            <Stack direction="row" gap={3} className="flex-wrap">
              <Button onClick={modalDisclosure.open}>Open Modal</Button>
              <a href="/demo/composites/modal" className="inline-flex">
                <Button variant="outline">View Full Demo →</Button>
              </a>
            </Stack>

            <Modal
              isOpen={modalDisclosure.isOpen}
              onClose={modalDisclosure.close}
              title="Example Modal"
              description="Built with Headless UI Dialog"
              size="md"
              footer={
                <>
                  <Button variant="outline" onClick={modalDisclosure.close}>
                    Cancel
                  </Button>
                  <Button onClick={modalDisclosure.close}>
                    Confirm
                  </Button>
                </>
              }
            >
              <p className="text-gray-600">
                Modal content with full keyboard navigation. Press Escape to close.
              </p>
            </Modal>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4">More Composites Coming Soon</h3>
            <p className="text-gray-600">
              Additional composite components (Dialog, Dropdown, Tooltip, Tabs, Accordion, Popover)
              are being rebuilt with Headless UI to match specifications.
            </p>
          </Card>
        </Section>

        <Divider />

        {/* Responsive Demo */}
        <Section background="gray">
          <Card>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Responsive Design</h2>
            <p className="text-gray-600 mb-6">
              All components are fully responsive and follow mobile-first design principles.
              Resize your browser to see components adapt to different screen sizes.
            </p>
            <Grid cols="1" gap="4" className="md:grid-cols-2 lg:grid-cols-4">
              <Card variant="outlined" padding="md">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <h4 className="font-semibold">Mobile</h4>
                  <p className="text-sm text-gray-600">&lt; 640px</p>
                </div>
              </Card>
              <Card variant="outlined" padding="md">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <h4 className="font-semibold">Tablet</h4>
                  <p className="text-sm text-gray-600">640px - 1024px</p>
                </div>
              </Card>
              <Card variant="outlined" padding="md">
                <div className="text-center">
                  <div className="text-4xl mb-2">💻</div>
                  <h4 className="font-semibold">Desktop</h4>
                  <p className="text-sm text-gray-600">1024px - 1280px</p>
                </div>
              </Card>
              <Card variant="outlined" padding="md">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖥️</div>
                  <h4 className="font-semibold">Large</h4>
                  <p className="text-sm text-gray-600">&gt; 1280px</p>
                </div>
              </Card>
            </Grid>
          </Card>
        </Section>
      </Stack>
    </Container>
  );
}
