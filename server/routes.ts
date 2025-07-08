// routes.ts
// Refactored Express route definitions with centralized error handling,
// validation, sanitization, and modular routers for maintainability.

import express, { Express, Request, Response, NextFunction, Router } from 'express';
import { createServer, Server } from 'http';
import asyncHandler from 'express-async-handler';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { storage } from './storage';
import { analyticsService } from './analytics';
import { getQuestionHelp, explainAnswer } from './ai';
import { emailService } from './email-service';
import { authService } from './auth-service';
import { adminAuthService } from './admin-auth-service';
import { tokenAdminAuth } from './token-admin-auth';
import { validate } from './middleware/validation';
import { sanitize } from './middleware/sanitizer';
import { checkFreemium, recordFreemiumView } from './middleware/freemium';
import { seoService } from './seo-service';
import { recaptchaService } from './recaptcha-service';
import { trendingService } from './trending-service';
import { sitemapService } from './sitemap-service';
import { geolocationService } from './geolocation-service';
import { logAdminAction } from './middleware/logAdminAction';
import { z } from 'zod';

// Create main router and apply global middleware
const router = Router();
router.use(helmet());                                // Security headers
router.use(express.json({ limit: '10kb' }));         // Body parsing with size limit
router.use(rateLimit({                                // Simple rate limiting
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
}));

// Centralized error handler
function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
}

// Helper for health check
router.get('/api/health', asyncHandler(async (req, res) => {
  await storage.getSubjects();
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
}));

// --- Subjects Router ---
const subjectsRouter = Router();

subjectsRouter
  .route('/')
  .get(asyncHandler(async (req, res) => {
    const subjects = await storage.getSubjects();
    res.json(subjects);
  }))
  .post(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('body', z.object({ name: z.string().min(1), description: z.string().optional(), slug: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const subject = await storage.createSubject(req.body);
      res.status(201).json(subject);
    })
  );

subjectsRouter
  .route('/:slug')
  .get(validate('params', z.object({ slug: z.string().min(1) })), sanitize, asyncHandler(async (req, res) => {
    const subject = await storage.getSubjectBySlug(req.params.slug);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  }))
  .put(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ slug: z.string().min(1) })),
    validate('body', z.object({ name: z.string().optional(), description: z.string().optional(), slug: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const updated = await storage.updateSubject(req.params.slug, req.body);
      if (!updated) return res.status(404).json({ message: 'Subject not found' });
      res.json(updated);
    })
  )
  .delete(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ slug: z.string().min(1) })),
    sanitize,
    asyncHandler(async (req, res) => {
      const deleted = await storage.deleteSubject(req.params.slug);
      if (!deleted) return res.status(404).json({ message: 'Subject not found' });
      res.status(204).send();
    })
  );

router.use('/api/subjects', subjectsRouter);

// --- Exams Router ---
const examsRouter = Router();

examsRouter
  .route('/')
  .get(
    validate('query', z.object({ subjectSlug: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const { subjectSlug } = req.query;
      const exams = subjectSlug
        ? await storage.getExamsBySubject(String(subjectSlug))
        : await storage.getExams();
      res.json(exams);
    })
  )
  .post(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('body', z.object({ title: z.string(), subjectSlug: z.string(), description: z.string().optional(), slug: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const exam = await storage.createExam(req.body);
      res.status(201).json(exam);
    })
  );

examsRouter
  .route('/:slug')
  .get(validate('params', z.object({ slug: z.string() })), sanitize, asyncHandler(async (req, res) => {
    const exam = await storage.getExamBySlug(req.params.slug);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  }))
  .put(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ slug: z.string() })),
    validate('body', z.object({ title: z.string().optional(), subjectSlug: z.string().optional(), description: z.string().optional(), slug: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const updated = await storage.updateExam(req.params.slug, req.body);
      if (!updated) return res.status(404).json({ message: 'Exam not found' });
      res.json(updated);
    })
  )
  .delete(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ slug: z.string() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const deleted = await storage.deleteExam(req.params.slug);
      if (!deleted) return res.status(404).json({ message: 'Exam not found' });
      res.status(204).send();
    })
  );

router.use('/api/exams', examsRouter);

// --- Questions Router ---
const questionsRouter = Router();

questionsRouter
  .route('/')
  .get(
    checkFreemium,
    validate('query', z.object({ examId: z.string().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const { examId } = req.query;
      const data = examId
        ? await storage.getQuestionsByExam(Number(examId))
        : await storage.getQuestions();
      res.json({ questions: data, freemium: req.freemium });
    })
  )
  .post(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('body', z.object({ text: z.string(), options: z.array(z.string()), correctAnswer: z.number(), subjectSlug: z.string(), examSlug: z.string() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    })
  );

questionsRouter
  .route('/:id')
  .get(
    recordFreemiumView,
    validate('params', z.object({ id: z.string().regex(/^[0-9]+$/) })),
    sanitize,
    asyncHandler(async (req, res) => {
      const question = await storage.getQuestion(Number(req.params.id));
      if (!question) return res.status(404).json({ message: 'Question not found' });
      res.json({ ...question, freemium: req.freemium });
    })
  )
  .put(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ id: z.string().regex(/^[0-9]+$/) })),
    validate('body', z.object({ text: z.string().optional(), options: z.array(z.string()).optional(), correctAnswer: z.number().optional() })),
    sanitize,
    asyncHandler(async (req, res) => {
      const updated = await storage.updateQuestion(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: 'Question not found' });
      res.json(updated);
    })
  )
  .delete(
    tokenAdminAuth.middleware(),
    logAdminAction,
    validate('params', z.object({ id: z.string().regex(/^[0-9]+$/) })),
    sanitize,
    asyncHandler(async (req, res) => {
      const deleted = await storage.deleteQuestion(Number(req.params.id));
      if (!deleted) return res.status(404).json({ message: 'Question not found' });
      res.status(204).send();
    })
  );

router.use('/api/questions', questionsRouter);

// --- Analytics Router ---
const analyticsRouter = Router();

analyticsRouter.get('/overview/:userName', asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const [profile, exams, history, trends] = await Promise.all([
    analyticsService.getUserProfile(userName),
    analyticsService.getExamAnalytics(userName),
    analyticsService.getAnswerHistory(userName),
    analyticsService.getPerformanceTrends(userName)
  ]);
  res.json({ profile, exams, history, trends });
}));
analyticsRouter.post('/record-answer', validate('body', z.object({ questionId: z.number(), isCorrect: z.boolean(), timeSpent: z.number() })), sanitize, asyncHandler(async (req, res) => {
  const answer = await analyticsService.recordAnswer(req.body);
  res.status(201).json(answer);
}));
router.use('/api/analytics', analyticsRouter);

// ... Additional routers (auth, admin, geolocation, seo, sitemap) follow same pattern ...

// Mount routers on app and use error handler
export function registerRoutes(app: Express): Server {
  app.use('/', router);
  app.use(errorHandler);
  return createServer(app);
}
