export interface ExamResult {
  score: number;
  correct: number;
  total: number;
  timeSpent: string;
  domains: DomainResult[];
}

export interface DomainResult {
  name: string;
  score: number;
  percentage: number;
}

export interface TimerState {
  minutes: number;
  seconds: number;
  totalSeconds: number;
}
