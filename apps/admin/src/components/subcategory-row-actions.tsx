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
import type { CatalogSubcategorySummary } from '@brainliest/db';
import { deleteSubcategoryAction, updateSubcategoryAction } from '@/app/(panel)/taxonomy/actions';
import { SubcategoryForm } from './subcategory-form';

interface SubcategoryRowActionsProps {
  readonly categorySlug: string;
  readonly subcategory: CatalogSubcategorySummary;
  readonly categoryOptions: ReadonlyArray<SearchableSelectOption>;
}

export function SubcategoryRowActions({ categorySlug, subcategory, categoryOptions }: SubcategoryRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSubcategoryAction(subcategory.slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete subcategory. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `subcategory-form-${subcategory.slug}`, [subcategory.slug]);

  const defaultValues = useMemo(
    () => ({
      slug: subcategory.slug,
      categorySlug,
      name: subcategory.name,
      description: subcategory.description ?? undefined,
      icon: subcategory.icon ?? undefined,
      sortOrder: Number.isFinite(subcategory.sortOrder) ? String(subcategory.sortOrder) : undefined,
      active: subcategory.active,
    }),
    [categorySlug, subcategory]
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
            <span className="sr-only">Subcategory actions</span>
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
        title={`Edit ${subcategory.name}`}
        size="lg"
      >
        <SubcategoryForm
          action={updateSubcategoryAction}
          categories={categoryOptions}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="Subcategory details"
          description="Attach the subcategory to a category and manage visibility."
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
        title="Delete subcategory"
        description="Deleting a subcategory removes all associated subjects and unlink exams from this track."
        confirmLabel={isPending ? 'Deleting…' : 'Delete subcategory'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          Ensure dependent subjects are migrated before deleting.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
