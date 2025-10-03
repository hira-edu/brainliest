import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  Container,
  Icon,
  PracticeCourseNavigation,
  PracticeExamCard,
  PracticeLayout,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
  Section,
  Stack,
} from '@brainliest/ui';

const sidebarItems = [
  {
    label: 'AWS Cloud',
    href: '#aws',
    icon: <Icon name="Cloud" aria-hidden />,
    badge: <Badge size="sm">3</Badge>,
  },
  {
    label: 'Cisco Networking',
    href: '#cisco',
    icon: <Icon name="Network" aria-hidden />,
    badge: <Badge size="sm">2</Badge>,
  },
  {
    label: 'Cybersecurity',
    href: '#security',
    icon: <Icon name="ShieldCheck" aria-hidden />,
    badge: <Badge size="sm">2</Badge>,
  },
];

const menuItems = [
  { label: 'Overview', href: '#overview', isActive: true },
  { label: 'Most popular', href: '#popular' },
  { label: 'Recently added', href: '#recent' },
  { label: 'Upcoming', href: '#upcoming' },
];

export default function CatalogDemoPage() {
  return (
    <main className="space-y-16">
      <Section spacing="xl" background="gray">
        <Container maxWidth="2xl" className="space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Catalog</p>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">Modular catalog surfaces</h1>
            <p className="text-base text-gray-600 max-w-3xl">
              Combine layout, navigation, and exam cards to build category and track explorers. The demos below mirror the
              live catalog routes that fetch data from the taxonomy repository.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            {['Professional certifications', 'University programmes'].map((title, index) => (
              <Card key={title} padding="lg" className="space-y-4">
                <Stack gap={2}>
                  <div className="flex items-center gap-3">
                    <Icon name={index === 0 ? 'BriefcaseBusiness' : 'GraduationCap'} className="text-primary-600" />
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h2>
                      <p className="text-sm text-gray-600">
                        {index === 0
                          ? 'Cloud, networking, and cybersecurity certification tracks.'
                          : 'Faculty-curated mock exams for major undergraduate subjects.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" variant="secondary">View tracks</Button>
                    <Button size="sm" variant="ghost">Explore exams</Button>
                  </div>
                </Stack>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="xl">
        <Container maxWidth="5xl">
          <PracticeCourseNavigation
            courseLabel="Professional certifications"
            collectionLabel="3 learning tracks"
            sidebarItems={sidebarItems}
            menuItems={menuItems}
            footerAction={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/catalog">View live catalog</Link>
              </Button>
            }
            menuDescription="The navigation menu mirrors the live catalog route and can be customised per domain."
          />
        </Container>
      </Section>

      <Section spacing="xl" background="gray">
        <PracticeLayout
          sidebar={
            <PracticeSidebar>
              <PracticeSidebarChecklistCard items={['Architecture', 'Networking', 'Security']} />
              <PracticeSidebarShortcutsCard
                shortcuts={[
                  { key: 'Shift + S', description: 'Save track to dashboard' },
                  { key: 'Shift + /', description: 'Open command palette' },
                  { key: 'Shift + L', description: 'Toggle layout density' },
                ]}
              />
            </PracticeSidebar>
          }
        >
          <div className="space-y-6">
            <header className="space-y-2">
              <Stack gap={1}>
                <Badge variant="info">AWS Cloud track</Badge>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">AWS Solutions Architect exams</h2>
                <p className="text-base text-gray-600">
                  These cards reuse the practice exam module. Swap the metadata per exam while keeping status, tags, and
                  CTAs consistent.
                </p>
              </Stack>
            </header>

            <div className="grid gap-6">
              <PracticeExamCard
                title="AWS Solutions Architect Associate"
                subtitle="AWS Cloud"
                description="Design resilient, cost-optimised AWS architectures with HA, compute, and storage patterns."
                tags={['AWS', 'Architecture', 'Cloud']}
                stats={[
                  { label: 'Duration', value: '130 min' },
                  { label: 'Questions', value: '65' },
                  { label: 'Passing score', value: '720/1000' },
                  { label: 'Difficulty mix', value: 'M • H' },
                ]}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href="/catalog/professional/aws">View live track</Link>
                    </Button>
                    <Button variant="ghost">Share track</Button>
                  </div>
                }
              />
              <PracticeExamCard
                title="AWS Developer Associate"
                subtitle="AWS Cloud"
                description="Serverless & container-focused workloads with CI/CD, monitoring, and debugging coverage."
                tags={['AWS', 'Development', 'Serverless']}
                stats={[
                  { label: 'Duration', value: '130 min' },
                  { label: 'Questions', value: '65' },
                  { label: 'Passing score', value: '720/1000' },
                  { label: 'Difficulty mix', value: 'E • M • H' },
                ]}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary">Add to plan</Button>
                    <Button variant="ghost">Preview syllabus</Button>
                  </div>
                }
              />
            </div>
          </div>
        </PracticeLayout>
      </Section>
    </main>
  );
}
