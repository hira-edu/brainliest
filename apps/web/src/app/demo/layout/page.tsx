'use client';

import { Card, Container, Divider, Grid, Stack } from '@brainliest/ui';

const LayoutSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    {children}
  </section>
);

export default function LayoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Layout system</p>
        <h1 className="text-3xl font-bold text-gray-900">Composing structure</h1>
        <p className="max-w-3xl text-gray-600">
          Containers, cards, grids, stacks, and dividers provide the scaffolding for product surfaces. The examples below
          demonstrate the recommended combinations for content blocks and responsive layouts.
        </p>
      </header>

      <Stack gap={6}>
        <LayoutSection
          title="Responsive container"
          description="Wrap page content with consistent padding and max-width breakpoints."
        >
          <Container maxWidth="lg" className="rounded-2xl border border-dashed border-primary-300 bg-primary-50/40 p-6">
            <p className="text-sm text-primary-900">
              Container handles horizontal padding and max-width. Nest cards, grids, or sections inside to compose full
              layouts.
            </p>
          </Container>
        </LayoutSection>

        <LayoutSection
          title="Cards and stack spacing"
          description="Use Stack for vertical rhythm and Card for surface elevation."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="lg" className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Session summary</h2>
              <Stack gap={2}>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Questions answered</span>
                  <span className="font-medium text-gray-900">18 / 24</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Average accuracy</span>
                  <span className="font-medium text-success-600">82%</span>
                </div>
              </Stack>
            </Card>
            <Card padding="lg" variant="outlined" className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming milestones</h2>
              <Stack gap={2}>
                <p className="text-sm text-gray-600">• Submit practice log by Friday</p>
                <p className="text-sm text-gray-600">• Schedule tutoring session</p>
                <p className="text-sm text-gray-600">• Review flagged questions</p>
              </Stack>
            </Card>
          </div>
        </LayoutSection>

        <LayoutSection
          title="Grid layout"
          description="Align content responsively across columns using the Grid component."
        >
          <Grid cols="3" gap="6">
            <Card padding="md" className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Drafts</h3>
              <p className="text-sm text-gray-600">5 lessons ready for review</p>
            </Card>
            <Card padding="md" className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Published</h3>
              <p className="text-sm text-gray-600">18 lessons live</p>
            </Card>
            <Card padding="md" className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>
              <p className="text-sm text-gray-600">12 new student ratings</p>
            </Card>
          </Grid>
        </LayoutSection>

        <LayoutSection
          title="Dividers"
          description="Separate content groups with semantic `<hr>` styling."
        >
          <Card padding="lg" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Before the exam</h3>
              <p className="text-sm text-gray-600">Warm-up questions and topic reviews.</p>
            </div>
            <Divider />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">During the exam</h3>
              <p className="text-sm text-gray-600">Timer countdown, calculator toggles, and AI explanations.</p>
            </div>
            <Divider spacing="lg" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">After the exam</h3>
              <p className="text-sm text-gray-600">Flag review, bookmark exports, and score breakdown.</p>
            </div>
          </Card>
        </LayoutSection>
      </Stack>
    </main>
  );
}
