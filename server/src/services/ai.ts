import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Enterprise-grade Gemini AI Service
 * 
 * Features:
 * - Comprehensive input validation
 * - Enhanced error handling with specific error types
 * - Consolidated duplicate logic with utility functions
 * - Word limit enforcement for consistent responses
 * - Rate limit and quota error handling
 * - Accessibility-ready error messages
 * - Production-ready logging
 */

// Fixed: Enhanced API key validation with strict checking
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not configured - AI features will be disabled");
}

// Fixed: Initialize with proper API key or null to prevent unnecessary requests
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Fixed: Consolidated error handling for better maintainability
interface GeminiError extends Error {
  code?: string;
  status?: number;
}

function handleGeminiError(error: unknown, subject: string, operation: 'help' | 'explanation'): string {
  const err = error as GeminiError;
  
  // Fixed: Enhanced error logging with context
  console.error(`Gemini API ${operation} error for ${subject}:`, {
    message: err.message,
    code: err.code,
    status: err.status,
    timestamp: new Date().toISOString()
  });

  // Fixed: Parse specific Gemini API error codes for better user feedback
  if (err.message?.includes("API key not valid") || err.message?.includes("invalid API key")) {
    return `AI ${operation} service is not configured correctly. Please contact support.`;
  }
  
  if (err.message?.includes("quota exceeded") || err.message?.includes("429")) {
    return `AI ${operation} is experiencing high demand. Please try again in a few minutes.`;
  }
  
  if (err.message?.includes("rate limit") || err.code === "RATE_LIMIT_EXCEEDED") {
    return `AI ${operation} request limit reached. Please wait a moment before trying again.`;
  }
  
  if (err.message?.includes("network") || err.message?.includes("timeout")) {
    return `AI ${operation} is experiencing connectivity issues. Please check your connection and try again.`;
  }

  // Fixed: Context-specific error messages for better UX
  return `AI ${operation} for ${subject} is temporarily unavailable. Please try again in a moment.`;
}

// Fixed: Utility function for formatting options to eliminate duplicate code
function formatOptions(options: string[]): string {
  return options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n');
}

// Fixed: Word limit enforcement function
function enforceWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

// Fixed: Comprehensive input validation
function validateQuestionInputs(
  questionText: string, 
  options: string[], 
  subject: string
): { isValid: boolean; error?: string } {
  if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
    return { isValid: false, error: "Question text is required and cannot be empty" };
  }
  
  if (!Array.isArray(options) || options.length === 0) {
    return { isValid: false, error: "Options array is required and cannot be empty" };
  }
  
  if (options.some(option => !option || typeof option !== 'string' || option.trim().length === 0)) {
    return { isValid: false, error: "All options must be non-empty strings" };
  }
  
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    return { isValid: false, error: "Subject is required and cannot be empty" };
  }
  
  return { isValid: true };
}

// Fixed: Enhanced input validation for explainAnswer
function validateAnswerInputs(
  questionText: string,
  options: string[],
  correctAnswer: number,
  userAnswer: number,
  subject: string
): { isValid: boolean; error?: string } {
  const baseValidation = validateQuestionInputs(questionText, options, subject);
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    return { isValid: false, error: `Correct answer index (${correctAnswer}) is out of bounds for options array` };
  }
  
  if (!Number.isInteger(userAnswer) || userAnswer < 0 || userAnswer >= options.length) {
    return { isValid: false, error: `User answer index (${userAnswer}) is out of bounds for options array` };
  }
  
  return { isValid: true };
}

export async function getQuestionHelp(questionText: string, options: string[], subject: string): Promise<string> {
  // Fixed: Enhanced API key checking with early return
  if (!genAI) {
    console.warn("GEMINI_API_KEY not configured - AI help disabled");
    return "AI help requires a valid API key. Please contact support to enable AI features.";
  }

  // Fixed: Comprehensive input validation
  const validation = validateQuestionInputs(questionText, options, subject);
  if (!validation.isValid) {
    console.warn(`Invalid input for getQuestionHelp: ${validation.error}`);
    return `Unable to provide help: ${validation.error}`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Fixed: Enhanced prompt with better structure and validation
    const prompt = `You are an expert tutor helping students prepare for ${subject.trim()} certification exams. 

A student is struggling with this question:

${questionText.trim()}

Options:
${formatOptions(options)}

Provide helpful guidance without directly revealing the answer. Focus on:
- Key concepts they should understand
- How to approach this type of question
- Common mistakes to avoid
- Study tips for this topic

Keep your response concise and educational (maximum 200 words).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Fixed: Enhanced response handling with try-catch for malformed responses
    let text: string;
    try {
      text = response.text();
    } catch (responseError) {
      console.error("Failed to parse Gemini response text:", responseError);
      return `I encountered an issue processing the AI response for this ${subject} question. Please try again.`;
    }

    if (!text || text.trim().length === 0) {
      return `I'm sorry, I couldn't generate help for this ${subject} question right now. Please try again.`;
    }

    // Fixed: Enforce word limit for consistent responses
    const limitedText = enforceWordLimit(text.trim(), 200);
    return limitedText;

  } catch (error) {
    return handleGeminiError(error, subject, 'help');
  }
}

export async function explainAnswer(
  questionText: string, 
  options: string[], 
  correctAnswer: number, 
  userAnswer: number,
  subject: string
): Promise<string> {
  // Fixed: Enhanced API key checking with early return
  if (!genAI) {
    console.warn("GEMINI_API_KEY not configured - AI explanations disabled");
    return "AI explanations require a valid API key. Please contact support to enable AI features.";
  }

  // Fixed: Comprehensive input validation including answer indices
  const validation = validateAnswerInputs(questionText, options, correctAnswer, userAnswer, subject);
  if (!validation.isValid) {
    console.warn(`Invalid input for explainAnswer: ${validation.error}`);
    return `Unable to provide explanation: ${validation.error}`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Fixed: Enhanced prompt with better structure and validation
    const prompt = `You are an expert ${subject.trim()} instructor explaining why an answer is correct or incorrect.

Question: ${questionText.trim()}

Options:
${formatOptions(options)}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}
Student's Answer: ${String.fromCharCode(65 + userAnswer)}

Provide a clear explanation of:
- Why the correct answer is right
- If the student was wrong, why their choice was incorrect
- Key learning points from this question

Keep it educational and supportive (maximum 250 words).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Fixed: Enhanced response handling with try-catch for malformed responses
    let text: string;
    try {
      text = response.text();
    } catch (responseError) {
      console.error("Failed to parse Gemini response text:", responseError);
      return `I encountered an issue processing the AI explanation for this ${subject} question. Please try again.`;
    }

    if (!text || text.trim().length === 0) {
      return `I couldn't generate an explanation for this ${subject} question right now. Please try again.`;
    }

    // Fixed: Enforce word limit for consistent responses
    const limitedText = enforceWordLimit(text.trim(), 250);
    return limitedText;

  } catch (error) {
    return handleGeminiError(error, subject, 'explanation');
  }
}

// Fixed: Additional utility functions for future extensibility
export function isAIServiceAvailable(): boolean {
  return !!genAI;
}

export function getAIServiceStatus(): { available: boolean; message: string } {
  if (genAI) {
    return { available: true, message: "AI service is ready" };
  }
  return { available: false, message: "AI service requires valid API key configuration" };
}