/**
 * Custom Type Guards for Runtime Type Validation
 * Industry-grade type safety with runtime checks
 */

import type { 
  ApiError, 
  User, 
  Question, 
  AnswerSubmission, 
  ExamPaper, 
  Syllabus,
  Achievement,
  Reminder,
  AnalyticsData,
  AsyncState,
  EvaluationState,
  UploadState
} from '@/types/api';

// Utility type guard helpers
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

const hasProperty = <T extends Record<string, unknown>, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj;
};

// API Error Type Guard
export const isApiError = (value: unknown): value is ApiError => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'code') && 
         isString(value.code) &&
         value.code.trim().length > 0 && // Ensure non-empty code
         hasProperty(value, 'message') && 
         isString(value.message) &&
         value.message.trim().length > 0 && // Ensure non-empty message
         (!hasProperty(value, 'details') || value.details === undefined || value.details === null || isObject(value.details)) &&
         (!hasProperty(value, 'statusCode') || value.statusCode === undefined || value.statusCode === null || isNumber(value.statusCode)) &&
         (!hasProperty(value, 'timestamp') || value.timestamp === undefined || value.timestamp === null || isString(value.timestamp));
};

// User Type Guard
export const isUser = (value: unknown): value is User => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'email') && 
         isString(value.email) &&
         hasProperty(value, 'createdAt') && 
         isString(value.createdAt) &&
         hasProperty(value, 'updatedAt') && 
         isString(value.updatedAt) &&
         (!hasProperty(value, 'fullName') || value.fullName === null || isString(value.fullName)) &&
         (!hasProperty(value, 'institutionName') || value.institutionName === null || isString(value.institutionName));
};

// Question Type Guard
export const isQuestion = (value: unknown): value is Question => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'questionText') && 
         isString(value.questionText) &&
         hasProperty(value, 'paperId') && 
         isString(value.paperId) &&
         hasProperty(value, 'userId') && 
         isString(value.userId) &&
         hasProperty(value, 'isAnalyzed') && 
         isBoolean(value.isAnalyzed) &&
         hasProperty(value, 'maxMarks') && 
         isNumber(value.maxMarks) &&
         hasProperty(value, 'createdAt') && 
         isString(value.createdAt) &&
         (!hasProperty(value, 'difficulty') || 
          value.difficulty === null || 
          ['Easy', 'Medium', 'Hard'].includes(value.difficulty as string));
};

// Answer Submission Type Guard
export const isAnswerSubmission = (value: unknown): value is AnswerSubmission => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'questionId') && 
         isString(value.questionId) &&
         hasProperty(value, 'userId') && 
         isString(value.userId) &&
         hasProperty(value, 'answerText') && 
         isString(value.answerText) &&
         hasProperty(value, 'submissionType') && 
         ['text', 'handwritten', 'file'].includes(value.submissionType as string) &&
         hasProperty(value, 'maxScore') && 
         isNumber(value.maxScore) &&
         hasProperty(value, 'wordCount') && 
         isNumber(value.wordCount);
};

// Exam Paper Type Guard
export const isExamPaper = (value: unknown): value is ExamPaper => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'title') && 
         isString(value.title) &&
         hasProperty(value, 'examType') && 
         isString(value.examType) &&
         hasProperty(value, 'rawText') && 
         isString(value.rawText) &&
         hasProperty(value, 'status') && 
         ['pending', 'processing', 'completed', 'failed'].includes(value.status as string) &&
         hasProperty(value, 'questionCount') && 
         isNumber(value.questionCount) &&
         hasProperty(value, 'processingProgress') && 
         isNumber(value.processingProgress);
};

// Syllabus Type Guard
export const isSyllabus = (value: unknown): value is Syllabus => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'name') && 
         isString(value.name) &&
         hasProperty(value, 'examType') && 
         isString(value.examType) &&
         hasProperty(value, 'topics') && 
         isArray(value.topics) &&
         hasProperty(value, 'isTemplate') && 
         isBoolean(value.isTemplate) &&
         hasProperty(value, 'isPublic') && 
         isBoolean(value.isPublic);
};

// Achievement Type Guard
export const isAchievement = (value: unknown): value is Achievement => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'title') && 
         isString(value.title) &&
         hasProperty(value, 'description') && 
         isString(value.description) &&
         hasProperty(value, 'progress') && 
         isNumber(value.progress) &&
         hasProperty(value, 'isUnlocked') && 
         isBoolean(value.isUnlocked) &&
         hasProperty(value, 'category') && 
         ['streak', 'performance', 'milestone', 'special'].includes(value.category as string);
};

// Reminder Type Guard
export const isReminder = (value: unknown): value is Reminder => {
  if (!isObject(value)) return false;
  
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return hasProperty(value, 'id') && 
         isString(value.id) &&
         hasProperty(value, 'title') && 
         isString(value.title) &&
         hasProperty(value, 'time') && 
         isString(value.time) &&
         /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value.time) &&
         hasProperty(value, 'days') && 
         isArray(value.days) &&
         value.days.every(day => validDays.includes(day as string)) &&
         hasProperty(value, 'enabled') && 
         isBoolean(value.enabled);
};

// Analytics Data Type Guard
export const isAnalyticsData = (value: unknown): value is AnalyticsData => {
  if (!isObject(value)) return false;
  
  return hasProperty(value, 'subjectPerformance') && 
         isArray(value.subjectPerformance) &&
         hasProperty(value, 'topicDistribution') && 
         isArray(value.topicDistribution) &&
         hasProperty(value, 'difficultyBreakdown') && 
         isArray(value.difficultyBreakdown) &&
         hasProperty(value, 'progressOverTime') && 
         isArray(value.progressOverTime);
};

// Async State Type Guards
export const isAsyncState = <T>(value: unknown, dataGuard: (data: unknown) => data is T): value is AsyncState<T> => {
  if (!isObject(value)) return false;
  
  if (!hasProperty(value, 'status')) return false;
  
  switch (value.status) {
    case 'idle':
      return true;
    case 'loading':
      return !hasProperty(value, 'progress') || isNumber(value.progress);
    case 'success':
      return hasProperty(value, 'data') && dataGuard(value.data);
    case 'error':
      return hasProperty(value, 'error') && isApiError(value.error);
    default:
      return false;
  }
};

export const isEvaluationState = (value: unknown): value is EvaluationState => {
  if (!isObject(value)) return false;
  
  if (!hasProperty(value, 'status')) return false;
  
  switch (value.status) {
    case 'idle':
      return true;
    case 'evaluating':
      return hasProperty(value, 'progress') && 
             isNumber(value.progress) &&
             hasProperty(value, 'stage') && 
             isString(value.stage);
    case 'completed':
      return hasProperty(value, 'result') && 
             isObject(value.result) &&
             hasProperty(value, 'score') && 
             isNumber(value.score);
    case 'error':
      return hasProperty(value, 'error') && 
             isApiError(value.error) &&
             hasProperty(value, 'retryable') && 
             isBoolean(value.retryable);
    default:
      return false;
  }
};

export const isUploadState = (value: unknown): value is UploadState => {
  if (!isObject(value)) return false;
  
  if (!hasProperty(value, 'status')) return false;
  
  switch (value.status) {
    case 'idle':
    case 'selecting':
      return true;
    case 'uploading':
      return hasProperty(value, 'progress') && 
             isNumber(value.progress) &&
             hasProperty(value, 'fileName') && 
             isString(value.fileName);
    case 'processing':
      return hasProperty(value, 'stage') && 
             isString(value.stage);
    case 'completed':
      return hasProperty(value, 'fileId') && 
             isString(value.fileId) &&
             hasProperty(value, 'url') && 
             isString(value.url);
    case 'error':
      return hasProperty(value, 'error') && 
             isApiError(value.error);
    default:
      return false;
  }
};

// Array Type Guards
export const isUserArray = (value: unknown): value is User[] => {
  return isArray(value) && value.every(isUser);
};

export const isQuestionArray = (value: unknown): value is Question[] => {
  return isArray(value) && value.every(isQuestion);
};

export const isAnswerSubmissionArray = (value: unknown): value is AnswerSubmission[] => {
  return isArray(value) && value.every(isAnswerSubmission);
};

// Validation Helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTime = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

export const validateUUID = (uuid: string): boolean => {
  // More permissive UUID regex that accepts all valid UUID formats including version 6
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Runtime Validation with Error Messages
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const assertIsUser = (value: unknown): asserts value is User => {
  if (!isUser(value)) {
    throw new ValidationError('Invalid user object', 'user', value);
  }
};

export const assertIsQuestion = (value: unknown): asserts value is Question => {
  if (!isQuestion(value)) {
    throw new ValidationError('Invalid question object', 'question', value);
  }
};

export const assertIsApiError = (value: unknown): asserts value is ApiError => {
  if (!isApiError(value)) {
    throw new ValidationError('Invalid API error object', 'error', value);
  }
};

// Generic assertion function
export const assertType = <T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T => {
  if (!guard(value)) {
    throw new ValidationError(errorMessage, undefined, value);
  }
};

// Safe parsing with type guards
export const safeParseJson = <T>(
  json: string,
  guard: (value: unknown) => value is T
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const parsed = JSON.parse(json);
    if (guard(parsed)) {
      return { success: true, data: parsed };
    } else {
      return { success: false, error: 'Parsed JSON does not match expected type' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown parsing error' 
    };
  }
};

// Export all type guards for easy importing
export * from './type-guards';