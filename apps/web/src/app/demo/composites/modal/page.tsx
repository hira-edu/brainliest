'use client';

import { Modal, Button, Card, Stack, Container, useDisclosure } from '@brainliest/ui';

export default function ModalDemoPage() {
  const basic = useDisclosure();
  const withFooter = useDisclosure();
  const small = useDisclosure();
  const large = useDisclosure();
  const noOverlay = useDisclosure();

  return (
    <Container maxWidth="2xl" className="py-12">
      <Stack gap={8}>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Modal Component</h1>
          <p className="text-lg text-gray-600">
            Built with Headless UI - Fully accessible modal dialogs
          </p>
        </div>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">Examples</h2>
          <Stack gap={4}>
            {/* Basic Modal */}
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Modal</h3>
              <Button onClick={basic.open}>Open Basic Modal</Button>
              <Modal
                isOpen={basic.isOpen}
                onClose={basic.close}
                title="Basic Modal"
                description="This is a simple modal with title and description"
              >
                <p className="text-gray-600">
                  Modal content goes here. This component uses Headless UI Dialog
                  with full keyboard navigation and focus management.
                </p>
              </Modal>
            </div>

            {/* With Footer */}
            <div>
              <h3 className="text-lg font-medium mb-2">Modal with Footer</h3>
              <Button onClick={withFooter.open}>Open Modal with Footer</Button>
              <Modal
                isOpen={withFooter.isOpen}
                onClose={withFooter.close}
                title="Confirm Action"
                description="Please confirm your action"
                footer={
                  <>
                    <Button variant="outline" onClick={withFooter.close}>
                      Cancel
                    </Button>
                    <Button onClick={withFooter.close}>Confirm</Button>
                  </>
                }
              >
                <p className="text-gray-600">
                  This modal includes action buttons in the footer.
                </p>
              </Modal>
            </div>

            {/* Different Sizes */}
            <div>
              <h3 className="text-lg font-medium mb-2">Modal Sizes</h3>
              <Stack direction="row" gap={3} className="flex-wrap">
                <Button onClick={small.open}>Small</Button>
                <Button onClick={large.open}>Large</Button>
              </Stack>

              <Modal
                isOpen={small.isOpen}
                onClose={small.close}
                title="Small Modal"
                size="sm"
              >
                <p>Small modal (max-w-md)</p>
              </Modal>

              <Modal
                isOpen={large.isOpen}
                onClose={large.close}
                title="Large Modal"
                size="lg"
              >
                <p>Large modal (max-w-2xl) with more space for content</p>
              </Modal>
            </div>

            {/* No Overlay Close */}
            <div>
              <h3 className="text-lg font-medium mb-2">Prevent Overlay Close</h3>
              <Button onClick={noOverlay.open}>Open (No Overlay Close)</Button>
              <Modal
                isOpen={noOverlay.isOpen}
                onClose={noOverlay.close}
                title="Important Action"
                closeOnOverlayClick={false}
                footer={<Button onClick={noOverlay.close}>Close</Button>}
              >
                <p className="text-gray-600">
                  This modal cannot be closed by clicking the overlay.
                  You must use the close button or press Escape.
                </p>
              </Modal>
            </div>
          </Stack>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Prop</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Default</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-mono">isOpen</td>
                  <td className="py-2">boolean</td>
                  <td className="py-2">-</td>
                  <td className="py-2">Controls modal visibility</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">onClose</td>
                  <td className="py-2">() =&gt; void</td>
                  <td className="py-2">-</td>
                  <td className="py-2">Called when modal should close</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">title</td>
                  <td className="py-2">string</td>
                  <td className="py-2">-</td>
                  <td className="py-2">Modal title</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">size</td>
                  <td className="py-2">'sm' | 'md' | 'lg' | 'xl' | 'full'</td>
                  <td className="py-2">'md'</td>
                  <td className="py-2">Modal width</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">closeOnOverlayClick</td>
                  <td className="py-2">boolean</td>
                  <td className="py-2">true</td>
                  <td className="py-2">Allow closing by clicking overlay</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </Stack>
    </Container>
  );
}
