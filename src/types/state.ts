/**
 * Discriminated Unions for Complex State Management
 * Industry-grade type safety for application state
 */

import type { ApiError, User, Question, AnswerSubmission, AnswerEvaluation } from './api';

// Authentication State
export type AuthState = 
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'authenticating'; method: 'login' | 'signup' | 'oauth' }
  | { status: 'authenticated'; user: User; token: string; expiresAt: string }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: ApiError; lastAttempt?: string };

// Data Loading States
export type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number; message?: string }
  | { status: 'reloading'; data: T; progress?: number }
  | { status: 'success'; data: T; lastUpdated: string }
  | { status: 'error'; error: ApiError; lastData?: T };

// Form States
export type FormState<T> = 
  | { status: 'idle'; data: Partial<T> }
  | { status: 'validating'; data: Partial<T>; field?: keyof T }
  | { status: 'invalid'; data: Partial<T>; errors: FormErrors<T> }
  | { status: 'submitting'; data: T; progress?: number }
  | { status: 'success'; data: T; result?: unknown }
  | { status: 'error'; data: T; error: ApiError };

export type FormErrors<T> = {
  [K in keyof T]?: string[];
} & {
  _form?: string[];
};

// Question Management State
export type QuestionState = 
  | { status: 'idle' }
  | { status: 'loading_questions'; filters?: QuestionFilters }
  | { status: 'questions_loaded'; questions: Question[]; total: number; filters?: QuestionFilters }
  | { status: 'creating_question'; draft: Partial<Question> }
  | { status: 'question_created'; question: Question }
  | { status: 'updating_question'; questionId: string; updates: Partial<Question> }
  | { status: 'question_updated'; question: Question }
  | { status: 'deleting_question'; questionId: string }
  | { status: 'error'; error: ApiError; context?: string };

export interface QuestionFilters {
  subjects?: string[];
  topics?: string[];
  difficulty?: ('Easy' | 'Medium' | 'Hard')[];
  searchQuery?: string;
  dateRange?: { start: string; end: string };
}

// Answer Evaluation State
export type EvaluationState = 
  | { status: 'idle' }
  | { status: 'preparing'; submission: AnswerSubmission }
  | { status: 'uploading'; submission: AnswerSubmission; progress: number }
  | { status: 'processing_ocr'; submission: AnswerSubmission; stage: 'text_extraction' | 'image_processing' }
  | { status: 'evaluating'; submission: AnswerSubmission; progress: number; stage: EvaluationStage }
  | { status: 'completed'; submission: AnswerSubmission; evaluation: AnswerEvaluation; score: number }
  | { status: 'error'; error: ApiError; submission?: AnswerSubmission; retryable: boolean };

export type EvaluationStage = 
  | 'analyzing_content'
  | 'checking_structure'
  | 'comparing_model'
  | 'generating_feedback'
  | 'calculating_score'
  | 'finalizing';

// File Upload State
export type UploadState = 
  | { status: 'idle' }
  | { status: 'selecting'; accept?: string; multiple?: boolean }
  | { status: 'validating'; files: File[]; errors?: FileValidationError[] }
  | { status: 'uploading'; files: UploadingFile[]; overallProgress: number }
  | { status: 'processing'; files: ProcessingFile[]; stage: ProcessingStage }
  | { status: 'completed'; files: CompletedFile[] }
  | { status: 'error'; error: ApiError; files?: File[] };

export interface FileValidationError {
  file: File;
  errors: string[];
}

export interface UploadingFile {
  file: File;
  progress: number;
  uploadId: string;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

export interface ProcessingFile {
  fileId: string;
  fileName: string;
  stage: ProcessingStage;
  progress: number;
}

export interface CompletedFile {
  fileId: string;
  fileName: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export type ProcessingStage = 
  | 'virus_scan'
  | 'format_validation'
  | 'ocr_processing'
  | 'content_analysis'
  | 'thumbnail_generation'
  | 'metadata_extraction';

// Search State
export type SearchState<T> = 
  | { status: 'idle'; query?: string }
  | { status: 'searching'; query: string; filters?: Record<string, unknown> }
  | { status: 'results'; query: string; results: T[]; total: number; facets?: SearchFacets }
  | { status: 'no_results'; query: string; suggestions?: string[] }
  | { status: 'error'; error: ApiError; query?: string };

export interface SearchFacets {
  [key: string]: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

// Notification State
export type NotificationState = 
  | { status: 'idle' }
  | { status: 'requesting_permission' }
  | { status: 'permission_granted'; subscription?: PushSubscription }
  | { status: 'permission_denied'; reason?: string }
  | { status: 'showing_notification'; notification: AppNotification }
  | { status: 'error'; error: ApiError };

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  timestamp: string;
  read: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Theme State
export type ThemeState = 
  | { mode: 'light'; systemPreference?: 'light' | 'dark' }
  | { mode: 'dark'; systemPreference?: 'light' | 'dark' }
  | { mode: 'system'; systemPreference: 'light' | 'dark'; effective: 'light' | 'dark' };

// Connection State
export type ConnectionState = 
  | { status: 'online'; quality: 'excellent' | 'good' | 'poor'; speed?: number }
  | { status: 'offline'; lastOnline?: string }
  | { status: 'reconnecting'; attempts: number; nextRetry?: string }
  | { status: 'limited'; restrictions: string[] };

// Cache State
export type CacheState<T> = 
  | { status: 'empty' }
  | { status: 'loading'; key: string }
  | { status: 'cached'; data: T; key: string; cachedAt: string; expiresAt?: string }
  | { status: 'stale'; data: T; key: string; cachedAt: string; refreshing?: boolean }
  | { status: 'error'; error: ApiError; key: string };

// Sync State
export type SyncState = 
  | { status: 'idle' }
  | { status: 'syncing'; operations: SyncOperation[]; progress: number }
  | { status: 'synced'; lastSync: string; operations: number }
  | { status: 'conflict'; conflicts: SyncConflict[] }
  | { status: 'error'; error: ApiError; pendingOperations?: SyncOperation[] };

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data?: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface SyncConflict {
  id: string;
  entity: string;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  conflictFields: string[];
  resolution?: 'local' | 'remote' | 'merge';
}

// Modal State
export type ModalState = 
  | { status: 'closed' }
  | { status: 'opening'; modalId: string; props?: Record<string, unknown> }
  | { status: 'open'; modalId: string; props?: Record<string, unknown>; result?: unknown }
  | { status: 'closing'; modalId: string; result?: unknown };

// Toast State
export type ToastState = 
  | { status: 'idle'; toasts: Toast[] }
  | { status: 'showing'; toasts: Toast[]; activeToast: Toast }
  | { status: 'dismissing'; toasts: Toast[]; dismissingToast: Toast };

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: ToastAction;
  createdAt: string;
  dismissedAt?: string;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

// Pagination State
export type PaginationState = 
  | { status: 'idle'; page: 1; limit: number; total: 0 }
  | { status: 'loading'; page: number; limit: number; total?: number }
  | { status: 'loaded'; page: number; limit: number; total: number; hasNext: boolean; hasPrev: boolean }
  | { status: 'error'; error: ApiError; page: number; limit: number };

// Filter State
export type FilterState<T> = 
  | { status: 'idle'; filters: Partial<T> }
  | { status: 'applying'; filters: Partial<T>; previous?: Partial<T> }
  | { status: 'applied'; filters: Partial<T>; resultCount?: number }
  | { status: 'clearing'; filters: Partial<T> }
  | { status: 'error'; error: ApiError; filters: Partial<T> };

// Selection State
export type SelectionState<T> = 
  | { mode: 'none'; selected: [] }
  | { mode: 'single'; selected: [T]; primary: T }
  | { mode: 'multiple'; selected: T[]; primary?: T }
  | { mode: 'all'; excluded: T[]; total: number };

// Validation State
export type ValidationState<T> = 
  | { status: 'idle'; data: Partial<T> }
  | { status: 'validating'; data: Partial<T>; field?: keyof T }
  | { status: 'valid'; data: T }
  | { status: 'invalid'; data: Partial<T>; errors: ValidationErrors<T> };

export type ValidationErrors<T> = {
  [K in keyof T]?: {
    message: string;
    code: string;
    value?: T[K];
  }[];
};

// Undo/Redo State
export type UndoRedoState<T> = {
  past: T[];
  present: T;
  future: T[];
  canUndo: boolean;
  canRedo: boolean;
  maxHistorySize: number;
};

// Type Guards for State Management
export const isLoadingState = <T>(state: unknown): state is LoadingState<T> => {
  return typeof state === 'object' && 
         state !== null && 
         'status' in state &&
         ['idle', 'loading', 'reloading', 'success', 'error'].includes((state as any).status);
};

export const isFormState = <T>(state: unknown): state is FormState<T> => {
  return typeof state === 'object' && 
         state !== null && 
         'status' in state &&
         'data' in state &&
         ['idle', 'validating', 'invalid', 'submitting', 'success', 'error'].includes((state as any).status);
};

export const isEvaluationState = (state: unknown): state is EvaluationState => {
  return typeof state === 'object' && 
         state !== null && 
         'status' in state &&
         ['idle', 'preparing', 'uploading', 'processing_ocr', 'evaluating', 'completed', 'error'].includes((state as any).status);
};

// State Transition Helpers
export const createLoadingState = <T>(): LoadingState<T> => ({ status: 'idle' });

export const createFormState = <T>(initialData: Partial<T> = {}): FormState<T> => ({
  status: 'idle',
  data: initialData
});

export const createEvaluationState = (): EvaluationState => ({ status: 'idle' });

// Export all state types
export type * from './state';