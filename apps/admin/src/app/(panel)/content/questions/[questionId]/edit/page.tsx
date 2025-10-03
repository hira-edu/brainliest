import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { QuestionForm } from '@/components/question-form';
import { getQuestionById } from '@/lib/questions';
import { listTaxonomySubjects, getExamsBySubject } from '@/lib/taxonomy';
import { updateQuestionAction } from '../../actions';

interface EditQuestionPageProps {
  readonly params: Promise<{
    questionId: string;
  }>;
}

export async function generateMetadata({ params }: EditQuestionPageProps): Promise<Metadata> {
  const { questionId } = await params;
  const question = await getQuestionById(questionId);
  return {
    title: question
      ? `Edit ${question.id} · Questions · Brainliest Admin`
      : 'Edit question · Questions · Brainliest Admin',
  };
}

const toSubjectOption = (subject: Awaited<ReturnType<typeof listTaxonomySubjects>>[number]) => ({
  value: subject.slug,
  label: subject.name,
  description: subject.subcategoryName
    ? `${subject.categoryName} • ${subject.subcategoryName}`
    : subject.categoryName,
});

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { questionId } = await params;
  const question = await getQuestionById(questionId);
  if (!question) {
    notFound();
  }

  const subjects = await listTaxonomySubjects();
  const subjectOptions = subjects
    .map(toSubjectOption)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const examOptions = question.subjectSlug ? await getExamsBySubject(question.subjectSlug) : [];

  const defaultValues = {
    id: question.id,
    text: question.stemMarkdown,
    explanation: question.explanationMarkdown ?? '',
    allowMultiple: question.type === 'multi',
    difficulty: question.difficulty,
    subjectSlug: question.subjectSlug,
    examSlug: question.examSlug ?? undefined,
    domain: question.domain ?? undefined,
    source: question.source ?? undefined,
    year: question.year ?? undefined,
    status: question.published ? 'published' : 'draft',
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      contentMarkdown: option.contentMarkdown,
      isCorrect: option.isCorrect,
    })),
  } as const;

  return (
    <AdminShell
      title="Edit question"
      description="Update content, metadata, and answer set for this question."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/content/questions' },
        { label: 'Questions', href: '/content/questions' },
        { label: question.id, href: `/content/questions/${question.id}/edit`, isCurrent: true },
      ]}
    >
      <QuestionForm
        action={updateQuestionAction}
        subjects={subjectOptions}
        initialExamOptions={examOptions.map((exam) => ({
          value: exam.value,
          label: exam.label,
          description: exam.description,
        }))}
        defaultValues={defaultValues}
        submitLabel="Save changes"
        headline="Question details"
        description="Review and update the prompt, solutions, and taxonomy assignments."
      />
    </AdminShell>
  );
}
