import { Subject, Exam, Question, Category, Subcategory, User } from '@shared/schema';

// CSV Template Definitions - Matching Admin Form Fields Exactly
export interface CSVTemplateField {
  columnName: string;
  fieldKey: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'array' | 'date';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  description: string;
}

export interface CSVTemplate {
  entityName: string;
  fileName: string;
  primaryKey: string;
  fields: CSVTemplateField[];
  relationships?: {
    [key: string]: {
      table: string;
      displayField: string;
      valueField: string;
    };
  };
}

// Subject CSV Template (matching SubjectManager form)
export const SUBJECT_CSV_TEMPLATE: CSVTemplate = {
  entityName: 'subjects',
  fileName: 'subjects_template.csv',
  primaryKey: 'id',
  fields: [
    {
      columnName: 'ID',
      fieldKey: 'id',
      type: 'number',
      required: false,
      description: 'Leave blank for new subjects, fill for updates'
    },
    {
      columnName: 'Subject Name',
      fieldKey: 'name',
      type: 'text',
      required: true,
      validation: { min: 1, max: 255 },
      description: 'Name of the certification or academic subject'
    },
    {
      columnName: 'Description',
      fieldKey: 'description',
      type: 'text',
      required: false,
      validation: { max: 1000 },
      description: 'Detailed description of the subject'
    },
    {
      columnName: 'Icon',
      fieldKey: 'icon',
      type: 'text',
      required: false,
      description: 'FontAwesome class (e.g., fas fa-certificate) or emoji'
    },
    {
      columnName: 'Category ID',
      fieldKey: 'categoryId',
      type: 'number',
      required: false,
      description: 'ID of the parent category'
    },
    {
      columnName: 'Subcategory ID',
      fieldKey: 'subcategoryId',
      type: 'number',
      required: false,
      description: 'ID of the parent subcategory'
    },
    {
      columnName: 'Is Active',
      fieldKey: 'isActive',
      type: 'boolean',
      required: false,
      options: ['true', 'false'],
      description: 'Whether the subject is active (true/false)'
    },
    {
      columnName: 'Sort Order',
      fieldKey: 'sortOrder',
      type: 'number',
      required: false,
      validation: { min: 0 },
      description: 'Display order (0 = first)'
    },
    {
      columnName: 'Action',
      fieldKey: '_action',
      type: 'select',
      required: false,
      options: ['create', 'update', 'delete'],
      description: 'Action to perform: create, update, or delete'
    }
  ],
  relationships: {
    categoryId: {
      table: 'categories',
      displayField: 'name',
      valueField: 'id'
    },
    subcategoryId: {
      table: 'subcategories',
      displayField: 'name',
      valueField: 'id'
    }
  }
};

// Exam CSV Template (matching ExamManager form)
export const EXAM_CSV_TEMPLATE: CSVTemplate = {
  entityName: 'exams',
  fileName: 'exams_template.csv',
  primaryKey: 'id',
  fields: [
    {
      columnName: 'ID',
      fieldKey: 'id',
      type: 'number',
      required: false,
      description: 'Leave blank for new exams, fill for updates'
    },
    {
      columnName: 'Subject ID',
      fieldKey: 'subjectId',
      type: 'number',
      required: true,
      description: 'ID of the subject this exam belongs to'
    },
    {
      columnName: 'Exam Title',
      fieldKey: 'title',
      type: 'text',
      required: true,
      validation: { min: 1, max: 255 },
      description: 'Title of the practice exam'
    },
    {
      columnName: 'Description',
      fieldKey: 'description',
      type: 'text',
      required: false,
      validation: { max: 1000 },
      description: 'Description of the exam content'
    },
    {
      columnName: 'Difficulty',
      fieldKey: 'difficulty',
      type: 'select',
      required: true,
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      description: 'Difficulty level of the exam'
    },
    {
      columnName: 'Is Active',
      fieldKey: 'isActive',
      type: 'boolean',
      required: false,
      options: ['true', 'false'],
      description: 'Whether the exam is active (true/false)'
    },
    {
      columnName: 'Action',
      fieldKey: '_action',
      type: 'select',
      required: false,
      options: ['create', 'update', 'delete'],
      description: 'Action to perform: create, update, or delete'
    }
  ],
  relationships: {
    subjectId: {
      table: 'subjects',
      displayField: 'name',
      valueField: 'id'
    }
  }
};

// Question CSV Template (matching QuestionManager form)
export const QUESTION_CSV_TEMPLATE: CSVTemplate = {
  entityName: 'questions',
  fileName: 'questions_template.csv',
  primaryKey: 'id',
  fields: [
    {
      columnName: 'ID',
      fieldKey: 'id',
      type: 'number',
      required: false,
      description: 'Leave blank for new questions, fill for updates'
    },
    {
      columnName: 'Exam ID',
      fieldKey: 'examId',
      type: 'number',
      required: true,
      description: 'ID of the exam this question belongs to'
    },
    {
      columnName: 'Subject ID',
      fieldKey: 'subjectId',
      type: 'number',
      required: true,
      description: 'ID of the subject this question belongs to'
    },
    {
      columnName: 'Question Text',
      fieldKey: 'text',
      type: 'text',
      required: true,
      validation: { min: 10 },
      description: 'The question text'
    },
    {
      columnName: 'Options',
      fieldKey: 'options',
      type: 'array',
      required: true,
      description: 'Answer options separated by | (e.g., Option A|Option B|Option C|Option D)'
    },
    {
      columnName: 'Correct Answer',
      fieldKey: 'correctAnswer',
      type: 'number',
      required: true,
      validation: { min: 0 },
      description: 'Index of correct answer (0-based)'
    },
    {
      columnName: 'Allow Multiple Answers',
      fieldKey: 'allowMultipleAnswers',
      type: 'boolean',
      required: false,
      options: ['true', 'false'],
      description: 'Whether multiple answers are allowed (true/false)'
    },
    {
      columnName: 'Correct Answers',
      fieldKey: 'correctAnswers',
      type: 'array',
      required: false,
      description: 'Indices of correct answers for multiple choice (e.g., 0,2,3)'
    },
    {
      columnName: 'Explanation',
      fieldKey: 'explanation',
      type: 'text',
      required: false,
      description: 'Explanation for the correct answer'
    },
    {
      columnName: 'Domain',
      fieldKey: 'domain',
      type: 'text',
      required: false,
      description: 'Knowledge domain or category'
    },
    {
      columnName: 'Difficulty',
      fieldKey: 'difficulty',
      type: 'select',
      required: false,
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      description: 'Question difficulty level'
    },
    {
      columnName: 'Order',
      fieldKey: 'order',
      type: 'number',
      required: false,
      validation: { min: 1 },
      description: 'Question order in the exam'
    },
    {
      columnName: 'Action',
      fieldKey: '_action',
      type: 'select',
      required: false,
      options: ['create', 'update', 'delete'],
      description: 'Action to perform: create, update, or delete'
    }
  ],
  relationships: {
    examId: {
      table: 'exams',
      displayField: 'title',
      valueField: 'id'
    },
    subjectId: {
      table: 'subjects',
      displayField: 'name',
      valueField: 'id'
    }
  }
};

// Category CSV Template (matching CategoryManager form)
export const CATEGORY_CSV_TEMPLATE: CSVTemplate = {
  entityName: 'categories',
  fileName: 'categories_template.csv',
  primaryKey: 'id',
  fields: [
    {
      columnName: 'ID',
      fieldKey: 'id',
      type: 'number',
      required: false,
      description: 'Leave blank for new categories, fill for updates'
    },
    {
      columnName: 'Category Name',
      fieldKey: 'name',
      type: 'text',
      required: true,
      validation: { min: 1, max: 255 },
      description: 'Name of the category'
    },
    {
      columnName: 'Description',
      fieldKey: 'description',
      type: 'text',
      required: false,
      validation: { max: 1000 },
      description: 'Description of the category'
    },
    {
      columnName: 'Icon',
      fieldKey: 'icon',
      type: 'text',
      required: false,
      description: 'FontAwesome class or emoji'
    },
    {
      columnName: 'Color',
      fieldKey: 'color',
      type: 'text',
      required: false,
      description: 'Color code (e.g., #FF5733)'
    },
    {
      columnName: 'Is Active',
      fieldKey: 'isActive',
      type: 'boolean',
      required: false,
      options: ['true', 'false'],
      description: 'Whether the category is active (true/false)'
    },
    {
      columnName: 'Sort Order',
      fieldKey: 'sortOrder',
      type: 'number',
      required: false,
      validation: { min: 0 },
      description: 'Display order (0 = first)'
    },
    {
      columnName: 'Action',
      fieldKey: '_action',
      type: 'select',
      required: false,
      options: ['create', 'update', 'delete'],
      description: 'Action to perform: create, update, or delete'
    }
  ]
};

// Subcategory CSV Template (matching SubcategoryManager form)
export const SUBCATEGORY_CSV_TEMPLATE: CSVTemplate = {
  entityName: 'subcategories',
  fileName: 'subcategories_template.csv',
  primaryKey: 'id',
  fields: [
    {
      columnName: 'ID',
      fieldKey: 'id',
      type: 'number',
      required: false,
      description: 'Leave blank for new subcategories, fill for updates'
    },
    {
      columnName: 'Category ID',
      fieldKey: 'categoryId',
      type: 'number',
      required: true,
      description: 'ID of the parent category'
    },
    {
      columnName: 'Subcategory Name',
      fieldKey: 'name',
      type: 'text',
      required: true,
      validation: { min: 1, max: 255 },
      description: 'Name of the subcategory'
    },
    {
      columnName: 'Description',
      fieldKey: 'description',
      type: 'text',
      required: false,
      validation: { max: 1000 },
      description: 'Description of the subcategory'
    },
    {
      columnName: 'Icon',
      fieldKey: 'icon',
      type: 'text',
      required: false,
      description: 'FontAwesome class or emoji'
    },
    {
      columnName: 'Color',
      fieldKey: 'color',
      type: 'text',
      required: false,
      description: 'Color code (e.g., #FF5733)'
    },
    {
      columnName: 'Is Active',
      fieldKey: 'isActive',
      type: 'boolean',
      required: false,
      options: ['true', 'false'],
      description: 'Whether the subcategory is active (true/false)'
    },
    {
      columnName: 'Sort Order',
      fieldKey: 'sortOrder',
      type: 'number',
      required: false,
      validation: { min: 0 },
      description: 'Display order (0 = first)'
    },
    {
      columnName: 'Action',
      fieldKey: '_action',
      type: 'select',
      required: false,
      options: ['create', 'update', 'delete'],
      description: 'Action to perform: create, update, or delete'
    }
  ],
  relationships: {
    categoryId: {
      table: 'categories',
      displayField: 'name',
      valueField: 'id'
    }
  }
};

// Export all templates
export const CSV_TEMPLATES = {
  subjects: SUBJECT_CSV_TEMPLATE,
  exams: EXAM_CSV_TEMPLATE,
  questions: QUESTION_CSV_TEMPLATE,
  categories: CATEGORY_CSV_TEMPLATE,
  subcategories: SUBCATEGORY_CSV_TEMPLATE,
};

export type CSVEntityType = keyof typeof CSV_TEMPLATES;