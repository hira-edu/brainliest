import express from 'express';
import { storage } from '../storage.js';
import { parseSlugUrl } from '../../shared/utils/slug.js';

const router = express.Router();

/**
 * Handle slug-based exam URLs like /pmp/pmp-exam-help-1
 * Returns exam data for rendering question interface
 * Skip static assets and API routes
 */
router.get('/:subjectSlug/:examSlug', async (req, res, next) => {
  const { subjectSlug, examSlug } = req.params;
  const fullPath = req.path;
  
  // Skip if this looks like a static asset request
  if (fullPath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i)) {
    return next();
  }
  
  // Skip API routes and known paths
  const reservedPaths = ['api', 'src', 'assets', 'public', 'node_modules', '@vite', '@fs'];
  if (reservedPaths.includes(subjectSlug) || reservedPaths.includes(examSlug)) {
    return next();
  }
  
  // Skip if contains file extensions
  if (subjectSlug.includes('.') || examSlug.includes('.')) {
    return next();
  }
  try {
    const { subjectSlug, examSlug } = req.params;
    
    // Find subject by slug
    const subjects = await storage.getSubjects();
    const subject = subjects.find(s => s.slug === subjectSlug);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Find exam by slug
    const exams = await storage.getExamsBySubject(subject.id);
    const exam = exams.find(e => e.slug === examSlug);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Return exam and subject data
    res.json({
      exam,
      subject,
      url: `/${subjectSlug}/${examSlug}`
    });
    
  } catch (error) {
    console.error('Error handling slug route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * API endpoint to resolve slug to IDs for frontend routing
 */
router.get('/api/slug-resolve/:subjectSlug/:examSlug', async (req, res) => {
  try {
    const { subjectSlug, examSlug } = req.params;
    
    // Find subject by slug
    const subjects = await storage.getSubjects();
    const subject = subjects.find(s => s.slug === subjectSlug);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Find exam by slug
    const exams = await storage.getExamsBySubject(subject.id);
    const exam = exams.find(e => e.slug === examSlug);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Return IDs for frontend
    res.json({
      subjectId: subject.id,
      examId: exam.id,
      subjectName: subject.name,
      examTitle: exam.title
    });
    
  } catch (error) {
    console.error('Error resolving slug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;