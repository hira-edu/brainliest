export type Brand<T, U extends string> = T & { readonly __brand: U };

export type UserId = Brand<string, 'UserId'>;
export type QuestionId = Brand<string, 'QuestionId'>;
export type ExamSlug = Brand<string, 'ExamSlug'>;
export type SubjectSlug = Brand<string, 'SubjectSlug'>;

export interface QuestionOption {
  readonly id: string;
  readonly label: string; // "A" | "B" | "C" | ...
  readonly contentMarkdown: string;
}

export interface QuestionModel {
  readonly id: QuestionId;
  readonly examSlug: ExamSlug;
  readonly subjectSlug: SubjectSlug;
  readonly type: 'single' | 'multi';
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly stemMarkdown: string;
  readonly hasKatex: boolean;
  readonly options: ReadonlyArray<QuestionOption>;
  readonly correctChoiceIds: ReadonlyArray<string>;
  readonly explanationMarkdown?: string;
  readonly source?: string;
  readonly year?: number;
  readonly currentVersionId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
