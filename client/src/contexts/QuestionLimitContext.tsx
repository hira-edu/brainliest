import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface QuestionLimitContextType {
  viewedQuestions: Set<number>;
  canViewMoreQuestions: boolean;
  addViewedQuestion: (questionId: number) => void;
  getRemainingQuestions: () => number;
  isQuestionViewed: (questionId: number) => boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  resetViewedQuestions: () => void;
}

const QuestionLimitContext = createContext<QuestionLimitContextType | undefined>(undefined);

const MAX_FREE_QUESTIONS = 20;
const STORAGE_KEY = "brainliest_viewed_questions";

export function QuestionLimitProvider({ children }: { children: ReactNode }) {
  const [viewedQuestions, setViewedQuestions] = useState<Set<number>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load viewed questions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const questionIds = JSON.parse(stored);
        setViewedQuestions(new Set(questionIds));
      }
    } catch (error) {
      console.error("Failed to load viewed questions from storage:", error);
    }
  }, []);

  // Save viewed questions to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(viewedQuestions)));
    } catch (error) {
      console.error("Failed to save viewed questions to storage:", error);
    }
  }, [viewedQuestions]);

  const addViewedQuestion = (questionId: number) => {
    setViewedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      
      // Show auth modal if user hits the limit
      if (newSet.size >= MAX_FREE_QUESTIONS) {
        setShowAuthModal(true);
      }
      
      return newSet;
    });
  };

  const canViewMoreQuestions = viewedQuestions.size < MAX_FREE_QUESTIONS;
  
  const getRemainingQuestions = () => Math.max(0, MAX_FREE_QUESTIONS - viewedQuestions.size);
  
  const isQuestionViewed = (questionId: number) => viewedQuestions.has(questionId);

  const resetViewedQuestions = () => {
    setViewedQuestions(new Set());
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <QuestionLimitContext.Provider 
      value={{ 
        viewedQuestions, 
        canViewMoreQuestions, 
        addViewedQuestion, 
        getRemainingQuestions,
        isQuestionViewed,
        showAuthModal,
        setShowAuthModal,
        resetViewedQuestions
      }}
    >
      {children}
    </QuestionLimitContext.Provider>
  );
}

export function useQuestionLimit() {
  const context = useContext(QuestionLimitContext);
  if (context === undefined) {
    throw new Error("useQuestionLimit must be used within a QuestionLimitProvider");
  }
  return context;
}