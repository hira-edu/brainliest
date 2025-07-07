import { DatabaseStorage } from './storage.js';

export interface UnifiedCSVData {
  entityType: 'subject' | 'exam' | 'question';
  // Subject fields
  subjectName?: string;
  subjectDescription?: string;
  subjectIcon?: string;
  subjectSortOrder?: number;
  subjectCategoryId?: number;
  subjectSubcategoryId?: number;
  
  // Exam fields  
  examTitle?: string;
  examDescription?: string;
  examSubjectId?: number;
  examSubjectName?: string;
  examDifficulty?: string;
  examTimeLimit?: number;
  examPassingScore?: number;
  examIsActive?: boolean;
  
  // Question fields
  questionText?: string;
  questionOptions?: string; // pipe-separated
  questionCorrectAnswer?: string;
  questionExplanation?: string;
  questionExamId?: number;
  questionExamTitle?: string;
  questionSubjectId?: number;
  questionSubjectName?: string;
  questionDomain?: string;
  questionDifficulty?: string;
  questionIsActive?: boolean;
}

export interface UnifiedCSVResult {
  success: boolean;
  subjects: number;
  exams: number;
  questions: number;
  errors: string[];
  message: string;
}

export class UnifiedCSVService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  generateUnifiedTemplate(): string {
    const headers = [
      'entity_type',
      // Subject columns
      'subject_name', 'subject_description', 'subject_icon', 'subject_sort_order', 'subject_category_id', 'subject_subcategory_id',
      // Exam columns
      'exam_title', 'exam_description', 'exam_subject_name', 'exam_difficulty', 'exam_time_limit', 'exam_passing_score', 'exam_is_active',
      // Question columns
      'question_text', 'question_options', 'question_correct_answer', 'question_explanation', 'question_exam_title', 'question_subject_name', 'question_domain', 'question_difficulty', 'question_is_active'
    ];

    const sampleRows = [
      // Subject examples
      ['subject', 'PMP Certification', 'Project Management Professional certification preparation', 'fas fa-project-diagram', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['subject', 'AWS Solutions Architect', 'Amazon Web Services cloud architecture certification', 'fab fa-aws', '2', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Exam examples  
      ['exam', '', '', '', '', '', '', 'PMP Practice Test 1', 'Comprehensive practice exam for PMP certification', 'PMP Certification', 'Intermediate', '240', '80', 'true', '', '', '', '', '', '', '', ''],
      ['exam', '', '', '', '', '', '', 'AWS SAA Practice Test', 'Practice test for AWS Solutions Architect Associate', 'AWS Solutions Architect', 'Advanced', '130', '72', 'true', '', '', '', '', '', '', '', ''],
      
      // Question examples
      ['question', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Which process group includes activities to define a new project?', 'Initiating|Planning|Executing|Monitoring', 'Initiating', 'The Initiating process group includes activities to define a new project or phase.', 'PMP Practice Test 1', 'PMP Certification', 'Project Integration Management', 'Intermediate', 'true'],
      ['question', '', '', '', '', '', '', '', '', '', '', '', '', '', 'What is the maximum size for an EC2 instance store?', '1 TB|3.75 TB|24 TB|48 TB', '48 TB', 'The largest instance store can provide up to 48 TB of storage.', 'AWS SAA Practice Test', 'AWS Solutions Architect', 'Compute', 'Advanced', 'true']
    ];

    const csvContent = [headers.join(',')];
    sampleRows.forEach(row => {
      csvContent.push(row.map(cell => `"${cell}"`).join(','));
    });

    return csvContent.join('\n');
  }

  async exportUnifiedData(): Promise<string> {
    const subjects = await this.storage.getSubjects();
    const exams = await this.storage.getExams();
    const questions = await this.storage.getQuestions();

    const headers = [
      'entity_type',
      'subject_name', 'subject_description', 'subject_icon', 'subject_sort_order', 'subject_category_id', 'subject_subcategory_id',
      'exam_title', 'exam_description', 'exam_subject_name', 'exam_difficulty', 'exam_time_limit', 'exam_passing_score', 'exam_is_active',
      'question_text', 'question_options', 'question_correct_answer', 'question_explanation', 'question_exam_title', 'question_subject_name', 'question_domain', 'question_difficulty', 'question_is_active'
    ];

    const rows = [headers.join(',')];

    // Export subjects
    for (const subject of subjects) {
      const row = [
        'subject',
        subject.name || '', subject.description || '', subject.icon || '', '', subject.categoryId?.toString() || '', subject.subcategoryId?.toString() || '',
        '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', ''
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    }

    // Export exams
    for (const exam of exams) {
      const subject = subjects.find(s => s.id === exam.subjectId);
      const row = [
        'exam',
        '', '', '', '', '', '',
        exam.title || '', exam.description || '', subject?.name || '', exam.difficulty || '', exam.duration?.toString() || '', '', exam.isActive?.toString() || 'true',
        '', '', '', '', '', '', '', '', ''
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    }

    // Export questions
    for (const question of questions) {
      const exam = exams.find(e => e.id === question.examId);
      const subject = subjects.find(s => s.id === question.subjectId);
      const options = question.options ? question.options.join('|') : '';
      
      const row = [
        'question',
        '', '', '', '', '', '',
        '', '', '', '', '', '', '',
        question.text || '', options, question.correctAnswer?.toString() || '', question.explanation || '', exam?.title || '', subject?.name || '', question.domain || '', question.difficulty || '', 'true'
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    }

    return rows.join('\n');
  }

  async importUnifiedData(csvContent: string): Promise<UnifiedCSVResult> {
    const result: UnifiedCSVResult = {
      success: false,
      subjects: 0,
      exams: 0,
      questions: 0,
      errors: [],
      message: ''
    };

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const dataLines = lines.slice(1);

      // Process subjects first
      for (const line of dataLines) {
        const values = this.parseCSVLine(line);
        if (values[0] === 'subject') {
          try {
            const subjectData = {
              name: values[1] || '',
              description: values[2] || '',
              icon: values[3] || null,
              sortOrder: values[4] ? parseInt(values[4]) : null,
              categoryId: values[5] ? parseInt(values[5]) : null,
              subcategoryId: values[6] ? parseInt(values[6]) : null
            };

            if (subjectData.name) {
              await this.storage.createSubject(subjectData);
              result.subjects++;
            }
          } catch (error) {
            result.errors.push(`Subject error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Get updated subjects for linking
      const subjects = await this.storage.getSubjects();

      // Process exams second
      for (const line of dataLines) {
        const values = this.parseCSVLine(line);
        if (values[0] === 'exam') {
          try {
            const subjectName = values[9];
            const subject = subjects.find(s => s.name === subjectName);
            
            if (!subject && subjectName) {
              result.errors.push(`Exam error: Subject "${subjectName}" not found`);
              continue;
            }

            const examData = {
              title: values[7] || '',
              description: values[8] || '',
              subjectId: subject?.id || 0,
              questionCount: 0, // Required field, will be updated when questions are added
              difficulty: values[10] || 'Intermediate',
              duration: values[11] ? parseInt(values[11]) : null,
              isActive: values[13] ? values[13].toLowerCase() === 'true' : true
            };

            if (examData.title && examData.subjectId) {
              await this.storage.createExam(examData);
              result.exams++;
            }
          } catch (error) {
            result.errors.push(`Exam error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Get updated exams for linking
      const exams = await this.storage.getExams();

      // Process questions last
      for (const line of dataLines) {
        const values = this.parseCSVLine(line);
        if (values[0] === 'question') {
          try {
            const examTitle = values[18];
            const subjectName = values[19];
            const exam = exams.find(e => e.title === examTitle);
            const subject = subjects.find(s => s.name === subjectName);

            const options = values[15] ? values[15].split('|') : [];
            const correctAnswerText = values[16] || '';
            const correctAnswerIndex = correctAnswerText ? options.indexOf(correctAnswerText) : 0;

            const questionData = {
              text: values[14] || '',
              options: options,
              correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
              explanation: values[17] || '',
              examId: exam?.id || 1, // Default to first exam if not found
              subjectId: subject?.id || 1, // Default to first subject if not found
              domain: values[20] || null,
              difficulty: values[21] || 'Intermediate'
            };

            if (questionData.text && questionData.options.length > 0 && questionData.examId && questionData.subjectId) {
              await this.storage.createQuestion(questionData);
              result.questions++;
            }
          } catch (error) {
            result.errors.push(`Question error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      result.success = true;
      result.message = `Successfully imported ${result.subjects} subjects, ${result.exams} exams, and ${result.questions} questions`;

    } catch (error) {
      result.success = false;
      result.message = error instanceof Error ? error.message : 'Unknown error occurred';
      result.errors.push(result.message);
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^"(.*)"$/, '$1'));
  }
}