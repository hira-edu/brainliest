import { ApiRequest, ApiResponse } from '../types/api';
import { storage } from '../services/storage.service';

export class ContentController {
  async getSubjects(req: ApiRequest, res: ApiResponse) {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch subjects' 
      });
    }
  }

  async getSubject(req: ApiRequest, res: ApiResponse) {
    try {
      const subjectId = parseInt(req.params.id);
      const subject = await storage.getSubject(subjectId);
      
      if (!subject) {
        return res.status(404).json({ 
          success: false, 
          message: 'Subject not found' 
        });
      }
      
      res.json(subject);
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch subject' 
      });
    }
  }

  async createSubject(req: ApiRequest, res: ApiResponse) {
    try {
      const subjectData = req.body;
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create subject' 
      });
    }
  }

  async updateSubject(req: ApiRequest, res: ApiResponse) {
    try {
      const subjectId = parseInt(req.params.id);
      const subjectData = req.body;
      const subject = await storage.updateSubject(subjectId, subjectData);
      
      if (!subject) {
        return res.status(404).json({ 
          success: false, 
          message: 'Subject not found' 
        });
      }
      
      res.json(subject);
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update subject' 
      });
    }
  }

  async deleteSubject(req: ApiRequest, res: ApiResponse) {
    try {
      const subjectId = parseInt(req.params.id);
      await storage.deleteSubject(subjectId);
      res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete subject' 
      });
    }
  }

  async getExams(req: ApiRequest, res: ApiResponse) {
    try {
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
      const exams = await storage.getAllExams(subjectId);
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch exams' 
      });
    }
  }

  // REMOVED: ID-based exam retrieval - Use slug-based methods for public operations
  // All exam access should use getExamBySlug() for modern routing

  async createExam(req: ApiRequest, res: ApiResponse) {
    try {
      const examData = req.body;
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create exam' 
      });
    }
  }

  async getQuestions(req: ApiRequest, res: ApiResponse) {
    try {
      const examId = req.query.examId ? parseInt(req.query.examId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const questions = await storage.getQuestions(examId, limit);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch questions' 
      });
    }
  }

  async createQuestion(req: ApiRequest, res: ApiResponse) {
    try {
      const questionData = req.body;
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create question' 
      });
    }
  }
}

export const contentController = new ContentController();