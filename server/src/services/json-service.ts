import { DatabaseStorage } from '../storage';
import { 
  InsertSubject, 
  InsertExam, 
  InsertQuestion,
  Subject,
  Exam,
  Question
} from '../../../shared/schema';

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
  categorySlug?: string;
  subcategorySlug?: string;
  
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
  subjectId?: string;
  examIds: string[];
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
        name: "AWS Solutions Architect Certification Prep",
        description: "Comprehensive preparation course for AWS Certified Solutions Architect Associate exam. Covers cloud architecture, security, cost optimization, and best practices for designing distributed systems on AWS platform.",
        icon: "cloud",
        color: "#FF9900",
        categorySlug: "professional-certifications",
        subcategorySlug: "cybersecurity",
        exams: [
          {
            title: "AWS Core Services Practice Exam",
            description: "Test your knowledge of fundamental AWS services including EC2, S3, VPC, and IAM. This exam covers basic cloud concepts and core AWS infrastructure components.",
            questionCount: 3,
            duration: 90,
            difficulty: "Beginner",
            isActive: true,
            questions: [
              {
                text: "Which AWS service provides scalable object storage with high durability and availability?",
                options: [
                  "Amazon EC2",
                  "Amazon S3", 
                  "Amazon EBS",
                  "Amazon RDS"
                ],
                correctAnswer: 1,
                correctAnswers: [1],
                allowMultipleAnswers: false,
                explanation: "Amazon S3 (Simple Storage Service) provides scalable object storage with 99.999999999% (11 9's) durability and high availability across multiple facilities.",
                domain: "Storage Services",
                difficulty: "Beginner",
                order: 1
              },
              {
                text: "Which of the following are components of Amazon VPC? (Select all that apply)",
                options: [
                  "Subnets",
                  "Internet Gateway",
                  "Route Tables", 
                  "Load Balancer",
                  "Security Groups"
                ],
                correctAnswer: 0,
                correctAnswers: [0, 1, 2, 4],
                allowMultipleAnswers: true,
                explanation: "VPC components include Subnets, Internet Gateway, Route Tables, and Security Groups. Load Balancer is a separate service that can be used within a VPC.",
                domain: "Networking",
                difficulty: "Intermediate",
                order: 2
              },
              {
                text: "What is the maximum size for a single S3 object?",
                options: [
                  "5 GB",
                  "5 TB",
                  "500 GB",
                  "50 TB"
                ],
                correctAnswer: 1,
                correctAnswers: [1],
                allowMultipleAnswers: false,
                explanation: "The maximum size for a single S3 object is 5 TB (terabytes). For objects larger than 100 MB, it's recommended to use multipart upload.",
                domain: "Storage Services",
                difficulty: "Intermediate",
                order: 3
              }
            ]
          },
          {
            title: "AWS Security & Identity Management", 
            description: "Advanced exam covering AWS security best practices, IAM policies, encryption, and compliance frameworks. Focus on securing AWS environments and implementing least privilege access.",
            questionCount: 2,
            duration: 60,
            difficulty: "Advanced",
            isActive: true,
            questions: [
              {
                text: "Which AWS service should you use to rotate database credentials automatically?",
                options: [
                  "AWS IAM",
                  "AWS Secrets Manager",
                  "AWS Systems Manager Parameter Store",
                  "AWS Key Management Service (KMS)"
                ],
                correctAnswer: 1,
                correctAnswers: [1],
                allowMultipleAnswers: false,
                explanation: "AWS Secrets Manager provides automatic rotation of database credentials, API keys, and other sensitive information with built-in integration for RDS, DocumentDB, and Redshift.",
                domain: "Security & Identity",
                difficulty: "Advanced",
                order: 1
              },
              {
                text: "What is the principle of least privilege in AWS IAM?",
                options: [
                  "Granting users minimum permissions required to perform their job functions",
                  "Using root account for all administrative tasks",
                  "Sharing IAM credentials between team members",
                  "Disabling MFA for better user experience"
                ],
                correctAnswer: 0,
                correctAnswers: [0],
                allowMultipleAnswers: false,
                explanation: "The principle of least privilege means granting users only the minimum permissions necessary to perform their job functions, reducing security risks and potential damage from compromised accounts.",
                domain: "Security & Identity",
                difficulty: "Advanced",
                order: 2
              }
            ]
          }
        ]
      },
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        description: "Comprehensive JSON template for hierarchical import - includes subject with categorySlug/subcategorySlug, multiple exams with descriptions and durations, and diverse question types with proper validation fields"
      }
    };
  }

  // Export existing data to JSON format
  async exportSubjectToJSON(subjectSlug: string, options: JSONExportOptions = {}): Promise<JSONImportData> {
    const subject = await this.storage.getSubjectBySlug(subjectSlug);
    if (!subject) {
      throw new Error(`Subject with slug ${subjectSlug} not found`);
    }

    const exams = await this.storage.getExamsBySubjectSlug(subjectSlug);
    const jsonExams: JSONExamData[] = [];

    for (const exam of exams) {
      const questions = await this.storage.getQuestionsByExamSlug(exam.slug);
      
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
        categorySlug: subject.categorySlug || undefined,
        subcategorySlug: subject.subcategorySlug || undefined,
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

    // Add comprehensive debugging for data structure validation
    console.log('🔍 JSON Validation - Received data structure:', JSON.stringify(data, null, 2));
    console.log('🔍 JSON Validation - data.subject exists:', !!data.subject);
    console.log('🔍 JSON Validation - data keys:', Object.keys(data || {}));
    
    // Validate root structure
    if (!data.subject) {
      console.log('❌ JSON Validation - Subject field missing at root level');
      console.log('🔍 JSON Validation - Full data dump:', data);
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

    if (subject.name && subject.name.length > 255) {
      errors.push({
        path: 'subject',
        field: 'name',
        value: subject.name,
        message: 'Subject name must be 255 characters or less'
      });
    }

    if (subject.description && (subject.description.length < 10 || subject.description.length > 2000)) {
      errors.push({
        path: 'subject',
        field: 'description',
        value: subject.description,
        message: 'Subject description must be between 10 and 2000 characters'
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

      if (exam.title && exam.title.length > 255) {
        errors.push({
          path: examPath,
          field: 'title',
          value: exam.title,
          message: 'Exam title must be 255 characters or less'
        });
      }

      if (exam.description && (exam.description.length < 10 || exam.description.length > 2000)) {
        errors.push({
          path: examPath,
          field: 'description',
          value: exam.description,
          message: 'Exam description must be between 10 and 2000 characters'
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

        if (question.text && question.text.length > 2000) {
          errors.push({
            path: questionPath,
            field: 'text',
            value: question.text,
            message: 'Question text must be 2000 characters or less'
          });
        }

        if (question.explanation && question.explanation.length > 2000) {
          errors.push({
            path: questionPath,
            field: 'explanation',
            value: question.explanation,
            message: 'Question explanation must be 2000 characters or less'
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
        result.subjectId = subject.slug;
      } else {
        // Create new subject
        const insertSubject: InsertSubject = {
          name: subjectData.name,
          description: subjectData.description,
          icon: subjectData.icon,
          color: subjectData.color,
          categorySlug: subjectData.categorySlug,
          subcategorySlug: subjectData.subcategorySlug
        };

        subject = await this.storage.createSubject(insertSubject);
        result.subjectId = subject.slug;
        result.createdCounts.subjects = 1;
      }

      // Create exams and questions
      for (const examData of subjectData.exams) {
        // Create exam
        const insertExam: InsertExam = {
          subjectSlug: subject.slug,
          title: examData.title,
          description: examData.description,
          questionCount: examData.questionCount,
          duration: examData.duration,
          difficulty: examData.difficulty,
          isActive: examData.isActive !== false
        };

        const exam = await this.storage.createExam(insertExam);
        result.examIds.push(exam.slug);
        result.createdCounts.exams++;

        // Create questions for this exam
        for (const questionData of examData.questions) {
          const insertQuestion: InsertQuestion = {
            examSlug: exam.slug,
            subjectSlug: subject.slug,
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