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
} from '@brainliest/ui';
import type { CatalogCategorySummary } from '@brainliest/db';
import { deleteCategoryAction, updateCategoryAction } from '@/app/(panel)/taxonomy/actions';
import { CategoryForm } from './category-form';

interface CategoryRowActionsProps {
  readonly category: CatalogCategorySummary;
}

export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete category. Please try again.');
      }
    });
  };

  const formId = useMemo(() => `category-form-${category.slug}`, [category.slug]);

  const defaultValues = useMemo(
    () => ({
      slug: category.slug,
      name: category.name,
      description: category.description ?? undefined,
      type: category.type,
      icon: category.icon ?? undefined,
      sortOrder: Number.isFinite(category.sortOrder) ? String(category.sortOrder) : undefined,
      active: category.active,
    }),
    [category]
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
            <span className="sr-only">Category actions</span>
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
        title={`Edit ${category.name}`}
        size="lg"
      >
        <CategoryForm
          action={updateCategoryAction}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          headline="Category details"
          description="Manage the highest level taxonomy grouping."
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
        title="Delete category"
        description="Deleting a category removes all nested subcategories and subjects."
        confirmLabel={isPending ? 'Deleting…' : 'Delete category'}
        confirmButtonProps={{ isLoading: isPending }}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-gray-600">
          This action cascades to subcategories and subjects. Ensure all content has been migrated first.
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-error-700">{errorMessage}</p> : null}
      </DeleteConfirmation>
    </>
  );
}
