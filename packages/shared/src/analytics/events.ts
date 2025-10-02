export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  EXAM_STARTED: 'exam_started',
  QUESTION_ANSWERED: 'question_answered',
  EXPLANATION_REQUESTED: 'explanation_requested',
  EXAM_COMPLETED: 'exam_completed',
  USER_REGISTERED: 'user_registered',
  SUBJECT_VIEWED: 'subject_viewed',
  SEARCH_PERFORMED: 'search_performed',
  ADMIN_ACTION: 'admin_action',
} as const;

export interface BaseEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  properties: Record<string, unknown>;
}

export interface ExamStartedEvent extends BaseEvent {
  eventName: typeof ANALYTICS_EVENTS.EXAM_STARTED;
  properties: {
    examSlug: string;
    subjectSlug: string;
    mode: 'practice' | 'timed';
  };
}

export interface QuestionAnsweredEvent extends BaseEvent {
  eventName: typeof ANALYTICS_EVENTS.QUESTION_ANSWERED;
  properties: {
    questionId: string;
    examSlug: string;
    domain: string;
    isCorrect: boolean;
    timeSpentMs: number;
  };
}
