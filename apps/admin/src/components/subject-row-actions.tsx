'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DeleteConfirmation,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Icon,
  Modal,
  type SearchableSelectOption,
} from '@brainliest/ui';
import type { CatalogSubjectSummary } from '@brainliest/db';
import { deleteSubjectAction, updateSubjectAction } from '@/app/(panel)/taxonomy/actions';
import { SubjectForm } from './subject-form';

interface SubjectRowActionsProps {
  readonly subject: CatalogSubjectSummary;
  readonly categories: ReadonlyArray<SearchableSelectOption>;
  readonly subcategoriesByCategory: Readonly<Record<string, ReadonlyArray<SearchableSelectOption>>>;
}

export function SubjectRowActions({ subject, categories, subcategoriesByCategory }: SubjectRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSubjectAction(subject.slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete subject. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `subject-form-${subject.slug}`, [subject.slug]);

  const defaultValues = useMemo(
    () => ({
      slug: subject.slug,
      categorySlug: subject.categorySlug,
      subcategorySlug: subject.subcategorySlug ?? undefined,
      name: subject.name,
      description: subject.description ?? undefined,
      icon: subject.icon ?? undefined,
      difficulty: subject.difficulty ?? undefined,
      tags: subject.tags.length > 0 ? subject.tags.join(', ') : '',
      metadata: Object.keys(subject.metadata ?? {}).length > 0 ? JSON.stringify(subject.metadata, null, 2) : '',
      active: subject.active,
    }),
    [subject]
  );

  const handleEditSuccess = useCallback(() => {
    setEditOpen(false);
    router.refresh();
  }, [router]);

  const handleOpenEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
  }, []);

  return (
    <>
      <Dropdown
        trigger={
          <Button type="button" variant="ghost" size="sm">
            <Icon name="EllipsisVertical" className="h-4 w-4" aria-hidden />
            <span className="sr-only">Subject actions</span>
          </Button>
        }
      >
        <DropdownItem
          onSelect={() => {
            handleOpenEdit();
          }}
        >
          Edit
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          onSelect={() => setDeleteOpen(true)}
          icon={<Icon name="Trash2" className="h-4 w-4 text-error-500" aria-hidden />}
          className="text-error-600"
        >
          Delete
        </DropdownItem>
      </Dropdown>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title={`Edit ${subject.name}`}
        size="xl"
      >
        <SubjectForm
          action={updateSubjectAction}
          categories={categories}
          subcategoriesByCategory={subcategoriesByCategory}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="Subject details"
          description="Connect the subject to taxonomy and configure discovery metadata."
          formId={formId}
          onSuccess={handleEditSuccess}
        />
      </Modal>

      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setErrorMessage(null);
        }}
        title="Delete subject"
        description="Deleting a subject detaches related exams and questions from this taxonomy branch."
        confirmLabel={isPending ? 'Deleting…' : 'Delete subject'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          Ensure dependent exams have been reassigned before deleting.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
