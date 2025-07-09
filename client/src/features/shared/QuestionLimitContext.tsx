import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CookieManager } from "../../utils/cookie-utils";

interface QuestionLimitContextType {
  viewedQuestions: Set<number>;
  canViewMoreQuestions: boolean;
  addViewedQuestion: (questionId: number) => void;
  getRemainingQuestions: () => number;
  isQuestionViewed: (questionId: number) => boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  resetViewedQuestions: () => void;
  getUsageStats: () => {
    totalViewed: number;
    remainingFree: number;
    percentageUsed: number;
  };
}

const QuestionLimitContext = createContext<QuestionLimitContextType | undefined>(undefined);

const MAX_FREE_QUESTIONS = 20;
const STORAGE_KEY = "brainliest_viewed_questions";
const SESSION_KEY = "brainliest_session_id";

export function QuestionLimitProvider({ children }: { children: ReactNode }) {
  const [viewedQuestions, setViewedQuestions] = useState<Set<number>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionId] = useState(() => 
    CookieManager.getCookie(SESSION_KEY) || 
    Math.random().toString(36).substring(2, 15)
  );

  // Initialize session ID cookie if not exists
  useEffect(() => {
    if (!CookieManager.getCookie(SESSION_KEY)) {
      CookieManager.setCookie(SESSION_KEY, sessionId, {
        expires: 30, // 30 days
        secure: true,
        sameSite: 'strict'
      });
    }
  }, [sessionId]);

  // Load viewed questions from cookies on mount
  useEffect(() => {
    try {
      // Check if user has consented to analytics cookies
      const { hasConsented, preferences } = CookieManager.getConsentStatus();
      
      if (hasConsented && preferences.analytics) {
        const stored = CookieManager.getCookie(STORAGE_KEY);
        if (stored) {
          try {
            const questionIds = JSON.parse(stored);
            setViewedQuestions(new Set(questionIds));
          } catch (error) {
            console.warn("Failed to parse stored question IDs from cookies:", error);
            CookieManager.deleteCookie(STORAGE_KEY);
          }
        }
      } else {
        // Fallback to localStorage for essential functionality
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const questionIds = JSON.parse(stored);
            setViewedQuestions(new Set(questionIds));
          } catch (error) {
            console.warn("Failed to parse stored question IDs from localStorage:", error);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load viewed questions from storage:", error);
    }
  }, []);

  // Save viewed questions to appropriate storage whenever it changes
  useEffect(() => {
    try {
      const questionArray = Array.from(viewedQuestions);
      
      // Check if user has consented to analytics cookies
      const { hasConsented, preferences } = CookieManager.getConsentStatus();
      
      if (hasConsented && preferences.analytics) {
        // Save to cookies with consent
        CookieManager.setCookie(STORAGE_KEY, JSON.stringify(questionArray), {
          expires: 30, // 30 days
          secure: true,
          sameSite: 'strict'
        });
      } else {
        // Fallback to localStorage for essential functionality
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questionArray));
      }
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
    CookieManager.removeCookie(STORAGE_KEY);
  };

  const getUsageStats = () => {
    const totalViewed = viewedQuestions.size;
    const remainingFree = Math.max(0, MAX_FREE_QUESTIONS - totalViewed);
    const percentageUsed = Math.round((totalViewed / MAX_FREE_QUESTIONS) * 100);
    
    return {
      totalViewed,
      remainingFree,
      percentageUsed
    };
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
        resetViewedQuestions,
        getUsageStats
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