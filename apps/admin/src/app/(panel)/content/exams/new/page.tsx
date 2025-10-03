import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin-shell';
import { ExamForm } from '@/components/exam-form';
import { createExamAction } from '../actions';
import { listTaxonomySubjects } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'Create exam · Content · Brainliest Admin',
};

const toSubjectOption = (subject: Awaited<ReturnType<typeof listTaxonomySubjects>>[number]) => ({
  value: subject.slug,
  label: subject.name,
  description: subject.subcategoryName
    ? `${subject.categoryName} • ${subject.subcategoryName}`
    : subject.categoryName,
});

export default async function NewExamPage() {
  const subjects = await listTaxonomySubjects();
  const subjectOptions = subjects
    .map(toSubjectOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  return (
    <AdminShell
      title="Create exam"
      description="Publish new practice milestones by wiring exams to subjects and release tracks."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/exams' },
        { label: 'Exams', href: '/content/exams' },
        { label: 'Create', href: '/content/exams/new', isCurrent: true },
      ]}
    >
      <ExamForm action={createExamAction} subjects={subjectOptions} submitLabel="Create exam" />
    </AdminShell>
  );
}
