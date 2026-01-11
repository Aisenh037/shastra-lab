/**
 * Comprehensive API Type Definitions
 * Industry-grade type safety for all API interactions
 */

// Base API Response Structure
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: 'loading' | 'success' | 'error';
  timestamp?: string;
}

// Detailed Error Information
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp?: string;
}

// Supabase Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
  count?: number | null;
  status?: number;
  statusText?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error: ApiError | null;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  institutionName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
  subscription?: SubscriptionInfo;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
  timezone: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  reminders: boolean;
  achievements: boolean;
  weeklyReport: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showProgress: boolean;
  allowAnalytics: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginSessions: LoginSession[];
}

export interface LoginSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SubscriptionInfo {
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt: string | null;
  features: string[];
}

// Question and Answer Types
export interface Question {
  id: string;
  paperId: string;
  userId: string;
  questionText: string;
  questionNumber: number | null;
  topic: string | null;
  subject: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  importanceExplanation: string | null;
  isAnalyzed: boolean;
  maxMarks: number;
  timeLimit: number | null; // in minutes
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerSubmission {
  id: string;
  questionId: string;
  userId: string;
  answerText: string;
  submissionType: 'text' | 'handwritten' | 'file';
  fileUrl: string | null;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  evaluation: AnswerEvaluation | null;
  timeSpent: number | null; // in seconds
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerEvaluation {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  paragraphAnalysis: ParagraphAnalysis[];
  formatSuggestions: string;
  modelComparison: string;
  rubricScores: RubricScore[];
  aiConfidence: number; // 0-100
}

export interface ParagraphAnalysis {
  paragraphNumber: number;
  content: string;
  feedback: string;
  rating: 'good' | 'average' | 'needs_improvement';
  suggestions: string[];
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

// Exam Paper Types
export interface ExamPaper {
  id: string;
  userId: string;
  syllabusId: string | null;
  title: string;
  examType: string;
  year: number | null;
  rawText: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  questionCount: number;
  processingProgress: number; // 0-100
  metadata: ExamPaperMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperMetadata {
  fileSize?: number;
  fileType?: string;
  pageCount?: number;
  language?: string;
  ocrConfidence?: number;
  processingTime?: number;
}

// Syllabus Types
export interface Syllabus {
  id: string;
  userId: string;
  name: string;
  examType: string;
  topics: SyllabusTopic[];
  description: string | null;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusTopic {
  id: string;
  name: string;
  description?: string;
  subtopics: string[];
  weightage?: number; // percentage
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

// Analytics Types
export interface AnalyticsData {
  subjectPerformance: SubjectPerformance[];
  topicDistribution: TopicDistribution[];
  difficultyBreakdown: DifficultyBreakdown[];
  progressOverTime: ProgressDataPoint[];
  streakData: StreakAnalytics;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  totalAttempts: number;
  improvementTrend: number; // percentage change
  lastAttemptDate: string;
  topTopics: string[];
}

export interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
  averageScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface DifficultyBreakdown {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
  averageScore: number;
  color: string;
}

export interface ProgressDataPoint {
  date: string;
  score: number;
  subject: string;
  questionCount: number;
}

export interface StreakAnalytics {
  currentStreak: number;
  longestStreak: number;
  totalPracticeDays: number;
  averageDaily: number;
  streakHistory: StreakDataPoint[];
}

export interface StreakDataPoint {
  date: string;
  practiced: boolean;
  streakCount: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  category: 'streak' | 'performance' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

// Reminder Types
export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  time: string; // HH:MM format
  days: WeekDay[];
  enabled: boolean;
  notificationTypes: NotificationType[];
  createdAt: string;
  updatedAt: string;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type NotificationType = 'email' | 'push' | 'sms';

// Mock Test Types
export interface MockTest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  questions: Question[];
  status: 'draft' | 'active' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  totalScore: number | null;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockTestSession {
  id: string;
  mockTestId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  timeRemaining: number; // in seconds
  currentQuestionIndex: number;
  answers: MockTestAnswer[];
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface MockTestAnswer {
  questionId: string;
  answerText: string;
  timeSpent: number; // in seconds
  isMarkedForReview: boolean;
  submittedAt: string;
}

// File Upload Types
export interface FileUpload {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  metadata: FileMetadata;
  createdAt: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  ocrText?: string;
  ocrConfidence?: number;
}

// Search and Filter Types
export interface SearchParams {
  query: string;
  filters: SearchFilters;
  sort: SortOptions;
  pagination: PaginationParams;
}

export interface SearchFilters {
  subjects?: string[];
  topics?: string[];
  difficulty?: ('Easy' | 'Medium' | 'Hard')[];
  dateRange?: {
    start: string;
    end: string;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  examTypes?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: SearchFacets;
  suggestions: string[];
}

export interface SearchFacets {
  subjects: FacetCount[];
  topics: FacetCount[];
  difficulty: FacetCount[];
  examTypes: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// Utility Types for Type Safety
export type NonNullable<T> = T extends null | undefined ? never : T;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Discriminated Union for Complex State Management
export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

export type EvaluationState = 
  | { status: 'idle' }
  | { status: 'evaluating'; progress: number; stage: string }
  | { status: 'completed'; result: AnswerEvaluation; score: number }
  | { status: 'error'; error: ApiError; retryable: boolean };

export type UploadState = 
  | { status: 'idle' }
  | { status: 'selecting' }
  | { status: 'uploading'; progress: number; fileName: string }
  | { status: 'processing'; stage: string }
  | { status: 'completed'; fileId: string; url: string }
  | { status: 'error'; error: ApiError; fileName?: string };

// Type Guards for Runtime Validation
export const isApiError = (value: unknown): value is ApiError => {
  return typeof value === 'object' && 
         value !== null && 
         'code' in value && 
         'message' in value;
};

export const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && 
         value !== null && 
         'id' in value && 
         'email' in value;
};

export const isQuestion = (value: unknown): value is Question => {
  return typeof value === 'object' && 
         value !== null && 
         'id' in value && 
         'questionText' in value;
};

// API Endpoint Types
export interface ApiEndpoints {
  // Authentication
  login: { method: 'POST'; body: { email: string; password: string }; response: { user: User; token: string } };
  logout: { method: 'POST'; body: never; response: { success: boolean } };
  
  // Questions
  getQuestions: { method: 'GET'; params: SearchParams; response: PaginatedResponse<Question> };
  createQuestion: { method: 'POST'; body: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>; response: Question };
  
  // Answers
  submitAnswer: { method: 'POST'; body: Omit<AnswerSubmission, 'id' | 'createdAt' | 'updatedAt'>; response: AnswerSubmission };
  evaluateAnswer: { method: 'POST'; body: { submissionId: string }; response: AnswerEvaluation };
  
  // Analytics
  getAnalytics: { method: 'GET'; params: { dateRange?: string; subjects?: string[] }; response: AnalyticsData };
}

// Export all types for easy importing
export type * from './api';