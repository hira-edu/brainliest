import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { ExamForm } from '@/components/exam-form';
import { getExamBySlug } from '@/lib/exams';
import { listTaxonomySubjects } from '@/lib/taxonomy';
import { updateExamAction } from '../../actions';

interface EditExamPageProps {
  readonly params: Promise<{ examSlug: string }>;
}

export async function generateMetadata({ params }: EditExamPageProps): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getExamBySlug(examSlug);
  return {
    title: exam
      ? `Edit ${exam.title} · Exams · Brainliest Admin`
      : 'Edit exam · Exams · Brainliest Admin',
  };
}

const toSubjectOption = (subject: Awaited<ReturnType<typeof listTaxonomySubjects>>[number]) => ({
  value: subject.slug,
  label: subject.name,
  description: subject.subcategoryName
    ? `${subject.categoryName} • ${subject.subcategoryName}`
    : subject.categoryName,
});

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { examSlug } = await params;
  const exam = await getExamBySlug(examSlug);
  if (!exam) {
    notFound();
  }

  const subjects = await listTaxonomySubjects();
  const subjectOptions = subjects
    .map(toSubjectOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const defaultValues = {
    slug: exam.slug,
    title: exam.title,
    description: exam.description ?? undefined,
    subjectSlug: exam.subjectSlug,
    difficulty: exam.difficulty ?? undefined,
    durationMinutes: exam.durationMinutes !== null && exam.durationMinutes !== undefined
      ? String(exam.durationMinutes)
      : undefined,
    questionTarget: exam.questionTarget !== null && exam.questionTarget !== undefined
      ? String(exam.questionTarget)
      : undefined,
    status: exam.status,
  } as const;

  return (
    <AdminShell
      title="Edit exam"
      description="Adjust title, taxonomy, and publishing controls for this exam."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/exams' },
        { label: 'Exams', href: '/content/exams' },
        { label: exam.title, href: `/content/exams/${exam.slug}/edit`, isCurrent: true },
      ]}
    >
      <ExamForm
        action={updateExamAction}
        subjects={subjectOptions}
        defaultValues={defaultValues}
        submitLabel="Save changes"
      />
    </AdminShell>
  );
}
