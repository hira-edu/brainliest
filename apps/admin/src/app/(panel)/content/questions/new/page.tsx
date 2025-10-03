import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { QuestionForm } from '@/components/question-form';
import { createQuestionAction } from '../actions';
import { listTaxonomySubjects, getExamsBySubject } from '@/lib/taxonomy';

interface NewQuestionPageProps {
  readonly searchParams?: Record<string, string | string[]>;
}

export const metadata: Metadata = {
  title: 'Create question · Content · Brainliest Admin',
};

const toOption = (subject: Awaited<ReturnType<typeof listTaxonomySubjects>>[number]) => ({
  value: subject.slug,
  label: subject.name,
  description: subject.subcategoryName
    ? `${subject.categoryName} • ${subject.subcategoryName}`
    : subject.categoryName,
});

function normaliseSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewQuestionPage({ searchParams }: NewQuestionPageProps) {
  const subjects = await listTaxonomySubjects();
  const subjectOptions = subjects
    .map(toOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const initialSubject = normaliseSearchParam(searchParams?.subject);
  const initialExamOptions = initialSubject ? await getExamsBySubject(initialSubject) : [];

  return (
    <AdminShell
      title="Create question"
      description="Capture new practice material and connect it to the right exams."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/questions' },
        { label: 'Questions', href: '/content/questions' },
        { label: 'Create', href: '/content/questions/new', isCurrent: true },
      ]}
    >
      <QuestionForm
        action={createQuestionAction}
        subjects={subjectOptions}
        initialExamOptions={initialExamOptions.map((exam) => ({
          value: exam.value,
          label: exam.label,
          description: exam.description,
        }))}
        defaultValues={{
          subjectSlug: initialSubject,
          status: 'draft',
          difficulty: 'MEDIUM',
        }}
        submitLabel="Create question"
        headline="Question blueprint"
        description="Fill in the stem, taxonomy, and answer set. You can revisit and publish once everything is verified."
      />
    </AdminShell>
  );
}
