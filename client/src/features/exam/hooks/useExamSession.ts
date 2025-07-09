import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ExamSession, Exam, Question } from "../../../../../shared/schema";
import { TimerState } from "../../../../../shared/types";
import { apiRequest, queryClient } from "../../../services/queryClient";

interface UseExamSessionProps {
  exam: Exam | undefined;
  questions: Question[];
}

interface ExamSessionState {
  sessionId: number | null;
  session: ExamSession | null;
  timer: TimerState;
  isCreatingSession: boolean;
  sessionError: Error | null;
  startSession: () => void;
  updateSession: (updates: Partial<ExamSession>) => Promise<void>;
  finishExam: () => void;
}

export function useExamSession({ exam, questions }: UseExamSessionProps): ExamSessionState {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [timer, setTimer] = useState<TimerState>({ 
    minutes: 60, 
    seconds: 0, 
    totalSeconds: 3600 
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Session creation mutation with proper error handling
  const createSessionMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest("/api/sessions", {
        method: "POST",
        body: { examId }
      });
      return response;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setSession(data);
      
      // Initialize timer based on exam duration
      if (exam?.duration) {
        const totalSeconds = exam.duration * 60;
        setTimer({
          minutes: exam.duration,
          seconds: 0,
          totalSeconds
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create exam session:", error);
    }
  });

  // Session update mutation with optimistic updates
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, updates }: { sessionId: number; updates: Partial<ExamSession> }) => {
      return apiRequest(`/api/sessions/${sessionId}`, {
        method: "PUT",
        body: updates
      });
    },
    onMutate: async ({ updates }) => {
      // Optimistic update
      if (session) {
        setSession(prev => prev ? { ...prev, ...updates } : null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error, { updates }) => {
      // Revert optimistic update on error
      if (session) {
        setSession(prev => {
          if (!prev) return null;
          const reverted = { ...prev };
          Object.keys(updates).forEach(key => {
            delete reverted[key as keyof ExamSession];
          });
          return reverted;
        });
      }
      console.error("Failed to update session:", error);
    }
  });

  // Auto-create session when exam loads
  useEffect(() => {
    if (exam?.id && !sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate(exam.id);
    }
  }, [exam?.id, sessionId, createSessionMutation.isPending]);

  // Timer countdown with proper cleanup
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timer.totalSeconds > 0 && sessionId && isActiveRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (!isActiveRef.current) return prev;
          
          const newTotal = prev.totalSeconds - 1;
          if (newTotal <= 0) {
            clearInterval(timerRef.current!);
            // Auto-finish exam when time runs out
            finishExam();
            return prev;
          }
          
          return {
            minutes: Math.floor(newTotal / 60),
            seconds: newTotal % 60,
            totalSeconds: newTotal
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer.totalSeconds, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startSession = useCallback(() => {
    if (exam?.id && !sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate(exam.id);
    }
  }, [exam?.id, sessionId, createSessionMutation.isPending]);

  const updateSession = useCallback(async (updates: Partial<ExamSession>) => {
    if (!sessionId) {
      throw new Error("No active session to update");
    }
    
    return new Promise<void>((resolve, reject) => {
      updateSessionMutation.mutate(
        { sessionId, updates },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });
  }, [sessionId]);

  const finishExam = useCallback(() => {
    if (!sessionId || !session || !exam || questions.length === 0) return;

    // Calculate final score
    let correctCount = 0;
    session.answers?.forEach((ans, idx) => {
      const question = questions[idx];
      if (question && parseInt(ans) === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const timeSpent = (exam.duration || 60) * 60 - timer.totalSeconds;

    updateSessionMutation.mutate(
      {
        sessionId,
        updates: {
          isCompleted: true,
          completedAt: new Date().toISOString(),
          score,
          timeSpent
        }
      },
      {
        onSuccess: () => {
          setLocation(`/results/${sessionId}`);
        },
        onError: (error) => {
          console.error("Failed to finish exam:", error);
          // Still navigate to results even if update fails
          setLocation(`/results/${sessionId}`);
        }
      }
    );
  }, [sessionId, session, exam, questions, timer.totalSeconds, setLocation]);

  return {
    sessionId,
    session,
    timer,
    isCreatingSession: createSessionMutation.isPending,
    sessionError: createSessionMutation.error,
    startSession,
    updateSession,
    finishExam
  };
}