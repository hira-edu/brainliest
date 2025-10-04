'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
  updateSubcategorySchema,
  createSubjectSchema,
  updateSubjectSchema,
} from '@/lib/shared-schemas';
import { isZodErrorLike, mapZodErrorIssues } from '@/lib/zod-helpers';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
  CreateSubjectInput,
  UpdateSubjectInput,
} from '@brainliest/db';
import { repositories } from '@/lib/repositories';

interface ActionState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const categoryFormInitialState: ActionState = { status: 'idle' };
export const subcategoryFormInitialState: ActionState = { status: 'idle' };
export const subjectFormInitialState: ActionState = { status: 'idle' };

export type CategoryFormState = ActionState;
export type SubcategoryFormState = ActionState;
export type SubjectFormState = ActionState;

const mapFieldErrors = (error: unknown): Record<string, string> => mapZodErrorIssues(error, { collapseOptionsPath: false });

interface CategoryPayloadShape {
  readonly slug: string;
  readonly name: string;
  readonly type: 'PROFESSIONAL' | 'ACADEMIC' | 'STANDARDIZED';
  readonly description?: string;
  readonly icon?: string;
  readonly sortOrder?: number;
  readonly active?: boolean;
}

interface SubcategoryPayloadShape {
  readonly slug: string;
  readonly categorySlug: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly sortOrder?: number;
  readonly active?: boolean;
}

interface SubjectPayloadShape {
  readonly slug: string;
  readonly categorySlug: string;
  readonly subcategorySlug?: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
  readonly active?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

const isOptionalNumber = (value: unknown): value is number | undefined =>
  value === undefined || typeof value === 'number';

const isOptionalBoolean = (value: unknown): value is boolean | undefined =>
  value === undefined || typeof value === 'boolean';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCategoryPayload = (value: unknown): value is CategoryPayloadShape => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    isOptionalString(value.description) &&
    isOptionalString(value.icon) &&
    isOptionalNumber(value.sortOrder) &&
    isOptionalBoolean(value.active)
  );
};

const isSubcategoryPayload = (value: unknown): value is SubcategoryPayloadShape => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.categorySlug === 'string' &&
    typeof value.name === 'string' &&
    isOptionalString(value.description) &&
    isOptionalString(value.icon) &&
    isOptionalNumber(value.sortOrder) &&
    isOptionalBoolean(value.active)
  );
};

const isSubjectPayload = (value: unknown): value is SubjectPayloadShape => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.categorySlug === 'string' &&
    isOptionalString(value.subcategorySlug) &&
    typeof value.name === 'string' &&
    isOptionalString(value.description) &&
    isOptionalString(value.icon) &&
    isOptionalString(value.difficulty) &&
    isStringArray(value.tags) &&
    isPlainObject(value.metadata) &&
    isOptionalBoolean(value.active)
  );
};

const getString = (formData: FormData, key: string, fallback = ''): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : fallback;
};

const getOptionalString = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getCheckbox = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  if (typeof value === 'string') {
    return value;
  }
  return '';
};

function toCreateCategoryInput(payload: CategoryPayloadShape): CreateCategoryInput {
  const type = payload.type.toLowerCase() as CreateCategoryInput['type'];
  return {
    slug: payload.slug,
    name: payload.name,
    type,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    sortOrder: payload.sortOrder,
    active: payload.active,
  } satisfies CreateCategoryInput;
}

function toUpdateCategoryInput(payload: CategoryPayloadShape): UpdateCategoryInput {
  const type = payload.type.toLowerCase() as CreateCategoryInput['type'];
  return {
    slug: payload.slug,
    name: payload.name,
    type,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    sortOrder: payload.sortOrder,
    active: payload.active,
  } satisfies UpdateCategoryInput;
}

function toCreateSubcategoryInput(payload: SubcategoryPayloadShape): CreateSubcategoryInput {
  return {
    slug: payload.slug,
    categorySlug: payload.categorySlug,
    name: payload.name,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    sortOrder: payload.sortOrder,
    active: payload.active,
  } satisfies CreateSubcategoryInput;
}

function toUpdateSubcategoryInput(payload: SubcategoryPayloadShape): UpdateSubcategoryInput {
  return {
    slug: payload.slug,
    categorySlug: payload.categorySlug,
    name: payload.name,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    sortOrder: payload.sortOrder,
    active: payload.active,
  } satisfies UpdateSubcategoryInput;
}

function toCreateSubjectInput(payload: SubjectPayloadShape): CreateSubjectInput {
  const difficulty = payload.difficulty ?? null;
  return {
    slug: payload.slug,
    categorySlug: payload.categorySlug,
    subcategorySlug: payload.subcategorySlug ?? null,
    name: payload.name,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    difficulty: difficulty as CreateSubjectInput['difficulty'],
    tags: payload.tags ?? [],
    metadata: payload.metadata ?? {},
    active: payload.active,
  } satisfies CreateSubjectInput;
}

function toUpdateSubjectInput(payload: SubjectPayloadShape): UpdateSubjectInput {
  const difficulty = payload.difficulty ?? null;
  return {
    slug: payload.slug,
    categorySlug: payload.categorySlug,
    subcategorySlug: payload.subcategorySlug ?? null,
    name: payload.name,
    description: payload.description ?? null,
    icon: payload.icon ?? null,
    difficulty: difficulty as CreateSubjectInput['difficulty'],
    tags: payload.tags ?? [],
    metadata: payload.metadata ?? {},
    active: payload.active,
  } satisfies UpdateSubjectInput;
}

export async function createCategoryAction(_: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  try {
    const parsed: unknown = createCategorySchema.parse({
      slug: getString(formData, 'slug'),
      name: getString(formData, 'name'),
      type: getString(formData, 'type'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      sortOrder: getOptionalString(formData, 'sortOrder'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isCategoryPayload(parsed)) {
      throw new Error('Category payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.createCategory(toCreateCategoryInput(payload), 'system-admin');
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    revalidatePath('/taxonomy/categories');
    if (stayOnPage) {
      return {
        status: 'success',
        message: 'Category created successfully.',
      } satisfies CategoryFormState;
    }

    redirect(`/taxonomy/categories/${payload.slug}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] create category failed', error);
    return {
      status: 'error',
      message: 'Unable to create category. Please try again.',
    };
  }

  return categoryFormInitialState;
}

export async function updateCategoryAction(_: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  try {
    const parsed: unknown = updateCategorySchema.parse({
      slug: getString(formData, 'slug'),
      name: getString(formData, 'name'),
      type: getString(formData, 'type'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      sortOrder: getOptionalString(formData, 'sortOrder'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isCategoryPayload(parsed)) {
      throw new Error('Category payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.updateCategory(toUpdateCategoryInput(payload), 'system-admin');

    revalidatePath('/taxonomy/categories');
    revalidatePath(`/taxonomy/categories/${payload.slug}/edit`);

    return {
      status: 'success',
      message: 'Category updated successfully.',
    };
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] update category failed', error);
    return {
      status: 'error',
      message: 'Unable to update category. Please try again.',
    };
  }
}

export async function deleteCategoryAction(slug: string): Promise<ActionState> {
  try {
    await repositories.taxonomy.deleteCategory(slug, 'system-admin');
    revalidatePath('/taxonomy/categories');
    return { status: 'success', message: 'Category deleted.' };
  } catch (error) {
    console.error('[taxonomy/actions] delete category failed', error);
    return { status: 'error', message: 'Unable to delete category. Please try again.' };
  }
}

export async function createSubcategoryAction(_: SubcategoryFormState, formData: FormData): Promise<SubcategoryFormState> {
  try {
    const parsed: unknown = createSubcategorySchema.parse({
      slug: getString(formData, 'slug'),
      categorySlug: getString(formData, 'categorySlug'),
      name: getString(formData, 'name'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      sortOrder: getOptionalString(formData, 'sortOrder'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isSubcategoryPayload(parsed)) {
      throw new Error('Subcategory payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.createSubcategory(toCreateSubcategoryInput(payload), 'system-admin');
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    revalidatePath('/taxonomy/subcategories');
    revalidatePath('/taxonomy/categories');
    if (stayOnPage) {
      return {
        status: 'success',
        message: 'Subcategory created successfully.',
      } satisfies SubcategoryFormState;
    }

    redirect(`/taxonomy/subcategories/${payload.slug}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] create subcategory failed', error);
    return {
      status: 'error',
      message: 'Unable to create subcategory. Please try again.',
    };
  }

  return subcategoryFormInitialState;
}

export async function updateSubcategoryAction(_: SubcategoryFormState, formData: FormData): Promise<SubcategoryFormState> {
  try {
    const parsed: unknown = updateSubcategorySchema.parse({
      slug: getString(formData, 'slug'),
      categorySlug: getString(formData, 'categorySlug'),
      name: getString(formData, 'name'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      sortOrder: getOptionalString(formData, 'sortOrder'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isSubcategoryPayload(parsed)) {
      throw new Error('Subcategory payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.updateSubcategory(toUpdateSubcategoryInput(payload), 'system-admin');

    revalidatePath('/taxonomy/subcategories');
    revalidatePath(`/taxonomy/subcategories/${payload.slug}/edit`);

    return {
      status: 'success',
      message: 'Subcategory updated successfully.',
    };
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] update subcategory failed', error);
    return {
      status: 'error',
      message: 'Unable to update subcategory. Please try again.',
    };
  }
}

export async function deleteSubcategoryAction(slug: string): Promise<ActionState> {
  try {
    await repositories.taxonomy.deleteSubcategory(slug, 'system-admin');
    revalidatePath('/taxonomy/subcategories');
    return { status: 'success', message: 'Subcategory deleted.' };
  } catch (error) {
    console.error('[taxonomy/actions] delete subcategory failed', error);
    return { status: 'error', message: 'Unable to delete subcategory. Please try again.' };
  }
}

export async function createSubjectAction(_: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  try {
    const parsed: unknown = createSubjectSchema.parse({
      slug: getString(formData, 'slug'),
      categorySlug: getString(formData, 'categorySlug'),
      subcategorySlug: getOptionalString(formData, 'subcategorySlug'),
      name: getString(formData, 'name'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      difficulty: getOptionalString(formData, 'difficulty'),
      tags: getOptionalString(formData, 'tags'),
      metadata: getOptionalString(formData, 'metadata'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isSubjectPayload(parsed)) {
      throw new Error('Subject payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.createSubject(toCreateSubjectInput(payload), 'system-admin');
    const submissionMode = formData.get('submissionMode');
    const stayOnPage = typeof submissionMode === 'string' && submissionMode === 'modal';

    revalidatePath('/taxonomy/subjects');
    revalidatePath('/taxonomy/subcategories');
    revalidatePath('/taxonomy/categories');

    if (stayOnPage) {
      return {
        status: 'success',
        message: 'Subject created successfully.',
      } satisfies SubjectFormState;
    }

    redirect(`/taxonomy/subjects/${payload.slug}/edit?created=1`);
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] create subject failed', error);
    return {
      status: 'error',
      message: 'Unable to create subject. Please try again.',
    };
  }

  return subjectFormInitialState;
}

export async function updateSubjectAction(_: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  try {
    const parsed: unknown = updateSubjectSchema.parse({
      slug: getString(formData, 'slug'),
      categorySlug: getString(formData, 'categorySlug'),
      subcategorySlug: getOptionalString(formData, 'subcategorySlug'),
      name: getString(formData, 'name'),
      description: getOptionalString(formData, 'description'),
      icon: getOptionalString(formData, 'icon'),
      difficulty: getOptionalString(formData, 'difficulty'),
      tags: getOptionalString(formData, 'tags'),
      metadata: getOptionalString(formData, 'metadata'),
      active: getCheckbox(formData, 'active'),
    });

    if (!isSubjectPayload(parsed)) {
      throw new Error('Subject payload failed validation');
    }

    const payload = parsed;

    await repositories.taxonomy.updateSubject(toUpdateSubjectInput(payload), 'system-admin');

    revalidatePath('/taxonomy/subjects');
    revalidatePath(`/taxonomy/subjects/${payload.slug}/edit`);

    return {
      status: 'success',
      message: 'Subject updated successfully.',
    };
  } catch (error) {
    if (isZodErrorLike(error)) {
      return {
        status: 'error',
        message: 'Please correct the highlighted fields.',
        fieldErrors: mapFieldErrors(error),
      };
    }

    console.error('[taxonomy/actions] update subject failed', error);
    return {
      status: 'error',
      message: 'Unable to update subject. Please try again.',
    };
  }
}

export async function deleteSubjectAction(slug: string): Promise<ActionState> {
  try {
    await repositories.taxonomy.deleteSubject(slug, 'system-admin');
    revalidatePath('/taxonomy/subjects');
    return { status: 'success', message: 'Subject deleted.' };
  } catch (error) {
    console.error('[taxonomy/actions] delete subject failed', error);
    return { status: 'error', message: 'Unable to delete subject. Please try again.' };
  }
}
