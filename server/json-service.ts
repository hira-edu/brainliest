import { DatabaseStorage } from './storage';
import { 
  InsertSubject, 
  InsertExam, 
  InsertQuestion,
  Subject,
  Exam,
  Question
} from '@shared/schema';

export interface JSONQuestionData {
  // Question fields
  text: string;
  options: string[];
  correctAnswer: number;
  correctAnswers?: number[];
  allowMultipleAnswers?: boolean;
  explanation?: string;
  domain?: string;
  difficulty: string;
  order?: number;
}

export interface JSONExamData {
  // Exam fields
  title: string;
  description?: string;
  questionCount: number;
  duration?: number;
  difficulty: string;
  isActive?: boolean;
  
  // Questions for this exam
  questions: JSONQuestionData[];
}

export interface JSONSubjectData {
  // Subject fields
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  categoryId?: number;
  subcategoryId?: number;
  
  // Exams for this subject
  exams: JSONExamData[];
}

export interface JSONImportData {
  subject: JSONSubjectData;
  metadata?: {
    version: string;
    createdAt: string;
    description?: string;
  };
}

export interface JSONValidationError {
  path: string;
  field: string;
  value: any;
  message: string;
}

export interface JSONProcessResult {
  success: boolean;
  subjectId?: number;
  examIds: number[];
  questionIds: number[];
  createdCounts: {
    subjects: number;
    exams: number;
    questions: number;
  };
  errors: JSONValidationError[];
  message: string;
}

export interface JSONExportOptions {
  includeIds?: boolean;
  includeMetadata?: boolean;
  prettyFormat?: boolean;
}

export class JSONService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // Generate JSON template with sample data
  generateTemplate(): JSONImportData {
    return {
      subject: {
        name: "Sample Subject Name",
        description: "Detailed description of the subject",
        icon: "book",
        color: "#3B82F6",
        categoryId: 1,
        subcategoryId: 1,
        exams: [
          {
            title: "Sample Exam 1",
            description: "Description of the first exam",
            questionCount: 2,
            duration: 60,
            difficulty: "Intermediate",
            isActive: true,
            questions: [
              {
                text: "What is the capital of France?",
                options: [
                  "London",
                  "Berlin", 
                  "Paris",
                  "Madrid"
                ],
                correctAnswer: 2,
                correctAnswers: [2],
                allowMultipleAnswers: false,
                explanation: "Paris is the capital and largest city of France.",
                domain: "Geography",
                difficulty: "Beginner",
                order: 1
              },
              {
                text: "Which of the following are programming languages? (Select all that apply)",
                options: [
                  "JavaScript",
                  "HTML",
                  "Python", 
                  "CSS",
                  "Java"
                ],
                correctAnswer: 0,
                correctAnswers: [0, 2, 4],
                allowMultipleAnswers: true,
                explanation: "JavaScript, Python, and Java are programming languages. HTML and CSS are markup and styling languages respectively.",
                domain: "Computer Science",
                difficulty: "Intermediate",
                order: 2
              }
            ]
          },
          {
            title: "Sample Exam 2", 
            description: "Description of the second exam",
            questionCount: 1,
            duration: 30,
            difficulty: "Advanced",
            isActive: true,
            questions: [
              {
                text: "Explain the concept of polymorphism in object-oriented programming.",
                options: [
                  "The ability of different classes to be treated as instances of the same type",
                  "The process of creating multiple instances of a class",
                  "The inheritance of properties from a parent class",
                  "The encapsulation of data within a class"
                ],
                correctAnswer: 0,
                explanation: "Polymorphism allows objects of different types to be treated as objects of a common base type.",
                domain: "Programming Concepts",
                difficulty: "Advanced",
                order: 1
              }
            ]
          }
        ]
      },
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        description: "Sample JSON template for importing subject with exams and questions"
      }
    };
  }

  // Export existing data to JSON format
  async exportSubjectToJSON(subjectId: number, options: JSONExportOptions = {}): Promise<JSONImportData> {
    const subject = await this.storage.getSubject(subjectId);
    if (!subject) {
      throw new Error(`Subject with ID ${subjectId} not found`);
    }

    const exams = await this.storage.getExamsBySubject(subjectId);
    const jsonExams: JSONExamData[] = [];

    for (const exam of exams) {
      const questions = await this.storage.getQuestionsByExam(exam.id);
      
      const jsonQuestions: JSONQuestionData[] = questions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctAnswers: q.correctAnswers || undefined,
        allowMultipleAnswers: q.allowMultipleAnswers || undefined,
        explanation: q.explanation || undefined,
        domain: q.domain || undefined,
        difficulty: q.difficulty,
        order: q.order || undefined
      }));

      jsonExams.push({
        title: exam.title,
        description: exam.description || undefined,
        questionCount: exam.questionCount,
        duration: exam.duration || undefined,
        difficulty: exam.difficulty,
        isActive: exam.isActive,
        questions: jsonQuestions
      });
    }

    const result: JSONImportData = {
      subject: {
        name: subject.name,
        description: subject.description || undefined,
        icon: subject.icon || undefined,
        color: subject.color || undefined,
        categoryId: subject.categoryId || undefined,
        subcategoryId: subject.subcategoryId || undefined,
        exams: jsonExams
      }
    };

    if (options.includeMetadata) {
      result.metadata = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        description: `Export of subject: ${subject.name}`
      };
    }

    return result;
  }

  // Validate JSON data structure
  validateJSONData(data: any): JSONValidationError[] {
    const errors: JSONValidationError[] = [];

    // Validate root structure
    if (!data.subject) {
      errors.push({
        path: 'root',
        field: 'subject',
        value: data.subject,
        message: 'Subject field is required'
      });
      return errors;
    }

    const subject = data.subject;

    // Validate subject fields
    if (!subject.name || typeof subject.name !== 'string') {
      errors.push({
        path: 'subject',
        field: 'name',
        value: subject.name,
        message: 'Subject name is required and must be a string'
      });
    }

    if (!Array.isArray(subject.exams)) {
      errors.push({
        path: 'subject',
        field: 'exams',
        value: subject.exams,
        message: 'Subject exams must be an array'
      });
      return errors;
    }

    if (subject.exams.length === 0) {
      errors.push({
        path: 'subject',
        field: 'exams',
        value: subject.exams,
        message: 'At least one exam is required'
      });
    }

    // Validate each exam
    subject.exams.forEach((exam: any, examIndex: number) => {
      const examPath = `subject.exams[${examIndex}]`;

      if (!exam.title || typeof exam.title !== 'string') {
        errors.push({
          path: examPath,
          field: 'title',
          value: exam.title,
          message: 'Exam title is required and must be a string'
        });
      }

      if (!exam.difficulty || typeof exam.difficulty !== 'string') {
        errors.push({
          path: examPath,
          field: 'difficulty',
          value: exam.difficulty,
          message: 'Exam difficulty is required and must be a string'
        });
      }

      if (!Array.isArray(exam.questions)) {
        errors.push({
          path: examPath,
          field: 'questions',
          value: exam.questions,
          message: 'Exam questions must be an array'
        });
        return;
      }

      if (exam.questions.length === 0) {
        errors.push({
          path: examPath,
          field: 'questions',
          value: exam.questions,
          message: 'At least one question is required per exam'
        });
      }

      // Validate each question
      exam.questions.forEach((question: any, questionIndex: number) => {
        const questionPath = `${examPath}.questions[${questionIndex}]`;

        if (!question.text || typeof question.text !== 'string') {
          errors.push({
            path: questionPath,
            field: 'text',
            value: question.text,
            message: 'Question text is required and must be a string'
          });
        }

        if (!Array.isArray(question.options) || question.options.length < 2) {
          errors.push({
            path: questionPath,
            field: 'options',
            value: question.options,
            message: 'Question options must be an array with at least 2 options'
          });
        }

        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0) {
          errors.push({
            path: questionPath,
            field: 'correctAnswer',
            value: question.correctAnswer,
            message: 'Question correctAnswer must be a non-negative number'
          });
        }

        if (!question.difficulty || typeof question.difficulty !== 'string') {
          errors.push({
            path: questionPath,
            field: 'difficulty',
            value: question.difficulty,
            message: 'Question difficulty is required and must be a string'
          });
        }
      });
    });

    return errors;
  }

  // Process JSON import
  async processJSONImport(jsonData: JSONImportData): Promise<JSONProcessResult> {
    const errors = this.validateJSONData(jsonData);
    
    if (errors.length > 0) {
      return {
        success: false,
        examIds: [],
        questionIds: [],
        createdCounts: { subjects: 0, exams: 0, questions: 0 },
        errors,
        message: `Validation failed with ${errors.length} errors`
      };
    }

    try {
      const result: JSONProcessResult = {
        success: true,
        examIds: [],
        questionIds: [],
        createdCounts: { subjects: 0, exams: 0, questions: 0 },
        errors: [],
        message: ''
      };

      // Create or find subject
      const subjectData = jsonData.subject;
      let subject: Subject;

      // Check if subject already exists by name
      const existingSubjects = await this.storage.getSubjects();
      const existingSubject = existingSubjects.find(s => s.name === subjectData.name);

      if (existingSubject) {
        subject = existingSubject;
        result.subjectId = subject.id;
      } else {
        // Create new subject
        const insertSubject: InsertSubject = {
          name: subjectData.name,
          description: subjectData.description,
          icon: subjectData.icon,
          color: subjectData.color,
          categoryId: subjectData.categoryId,
          subcategoryId: subjectData.subcategoryId
        };

        subject = await this.storage.createSubject(insertSubject);
        result.subjectId = subject.id;
        result.createdCounts.subjects = 1;
      }

      // Create exams and questions
      for (const examData of subjectData.exams) {
        // Create exam
        const insertExam: InsertExam = {
          subjectId: subject.id,
          title: examData.title,
          description: examData.description,
          questionCount: examData.questionCount,
          duration: examData.duration,
          difficulty: examData.difficulty,
          isActive: examData.isActive !== false
        };

        const exam = await this.storage.createExam(insertExam);
        result.examIds.push(exam.id);
        result.createdCounts.exams++;

        // Create questions for this exam
        for (const questionData of examData.questions) {
          const insertQuestion: InsertQuestion = {
            examId: exam.id,
            subjectId: subject.id,
            text: questionData.text,
            options: questionData.options,
            correctAnswer: questionData.correctAnswer,
            correctAnswers: questionData.correctAnswers,
            allowMultipleAnswers: questionData.allowMultipleAnswers,
            explanation: questionData.explanation,
            domain: questionData.domain,
            difficulty: questionData.difficulty,
            order: questionData.order
          };

          const question = await this.storage.createQuestion(insertQuestion);
          result.questionIds.push(question.id);
          result.createdCounts.questions++;
        }
      }

      result.message = `Successfully imported: ${result.createdCounts.subjects} subject(s), ${result.createdCounts.exams} exam(s), ${result.createdCounts.questions} question(s)`;
      return result;

    } catch (error) {
      return {
        success: false,
        examIds: [],
        questionIds: [],
        createdCounts: { subjects: 0, exams: 0, questions: 0 },
        errors: [{
          path: 'import',
          field: 'general',
          value: null,
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        message: 'Import process failed'
      };
    }
  }

  // Format JSON for download
  formatJSONForDownload(data: JSONImportData, options: JSONExportOptions = {}): string {
    if (options.prettyFormat !== false) {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }
}