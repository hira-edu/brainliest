'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DeleteConfirmation,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Icon,
} from '@brainliest/ui';
import { deleteCategoryAction } from '@/app/(panel)/taxonomy/actions';

interface CategoryRowActionsProps {
  readonly slug: string;
}

export function CategoryRowActions({ slug }: CategoryRowActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(slug);
      if (result.status === 'success') {
        setDeleteOpen(false);
        setErrorMessage(null);
        router.refresh();
      } else {
        setErrorMessage(result.message ?? 'Unable to delete category. Please try again.');
      }
    });
  };

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
        <DropdownItem href={`/taxonomy/categories/${slug}/edit`}>Edit</DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          onSelect={() => setDeleteOpen(true)}
          icon={<Icon name="Trash2" className="h-4 w-4 text-error-500" aria-hidden />}
          className="text-error-600"
        >
          Delete
        </DropdownItem>
      </Dropdown>

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
