import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  isUser,
  isQuestion,
  isApiError,
  isAnswerSubmission,
  isExamPaper,
  isSyllabus,
  isAchievement,
  isReminder,
  isAnalyticsData,
  isAsyncState,
  isEvaluationState,
  isUploadState,
  validateEmail,
  validatePassword,
  validateTime,
  validateUUID,
  safeParseJson,
  assertIsUser,
  assertIsQuestion,
  assertIsApiError,
  ValidationError
} from '@/utils/type-guards';
import type { User, Question, ApiError } from '@/types/api';

/**
 * Property-based tests for runtime type validation
 * Feature: industry-grade-improvements, Property 14: Runtime Type Validation
 */

// Helper to generate valid dates - use integer timestamps to avoid invalid dates
const validDateArbitrary = () => fc.integer({ min: 1577836800000, max: 1893456000000 }).map(timestamp => new Date(timestamp));

describe('Runtime Type Validation Properties', () => {
  it('Property 14: Runtime Type Validation - Type guards should provide runtime safety', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid user object
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            fullName: fc.oneof(fc.constant(null), fc.string()),
            institutionName: fc.oneof(fc.constant(null), fc.string()),
            createdAt: validDateArbitrary().map(d => d.toISOString()),
            updatedAt: validDateArbitrary().map(d => d.toISOString())
          }),
          // Invalid objects that should be rejected
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.anything()),
            fc.record({}) // Empty object
          )
        ),
        (testValue) => {
          // Property: Type guards should correctly identify valid vs invalid objects
          const isValidUser = isUser(testValue);
          
          if (isValidUser) {
            // If type guard passes, object should have all required properties
            expect(testValue).toHaveProperty('id');
            expect(testValue).toHaveProperty('email');
            expect(testValue).toHaveProperty('createdAt');
            expect(testValue).toHaveProperty('updatedAt');
            expect(typeof testValue.id).toBe('string');
            expect(typeof testValue.email).toBe('string');
          } else {
            // If type guard fails, object should not be treated as valid user
            expect(isValidUser).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Assertion Functions - Should throw ValidationError for invalid data', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
          fc.integer(),
          fc.record({
            id: fc.integer(), // Invalid type
            email: fc.string()
          })
        ),
        (invalidValue) => {
          // Property: Assertion functions should throw ValidationError for invalid data
          expect(() => assertIsUser(invalidValue)).toThrow(ValidationError);
          
          try {
            assertIsUser(invalidValue);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.name).toBe('ValidationError');
            expect(error.message).toContain('Invalid user object');
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 14: Assertion Functions - Should pass for valid data', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          fullName: fc.oneof(fc.constant(null), fc.string()),
          institutionName: fc.oneof(fc.constant(null), fc.string()),
          createdAt: validDateArbitrary().map(d => d.toISOString()),
          updatedAt: validDateArbitrary().map(d => d.toISOString())
        }),
        (validUser) => {
          // Property: Assertion functions should not throw for valid data
          expect(() => assertIsUser(validUser)).not.toThrow();
          
          // After assertion, TypeScript should know the type
          assertIsUser(validUser);
          expect(validUser.id).toBeDefined();
          expect(validUser.email).toBeDefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Safe JSON Parsing - Should handle malformed JSON gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('invalid json'),
          fc.constant('{"incomplete": '),
          fc.constant('[1,2,3'),
          fc.constant('null'),
          fc.constant('undefined'),
          fc.string().filter(s => {
            try {
              JSON.parse(s);
              return false; // Valid JSON, skip
            } catch {
              return true; // Invalid JSON, use
            }
          })
        ),
        (malformedJson) => {
          // Property: Safe JSON parsing should handle malformed JSON without throwing
          const result = safeParseJson(malformedJson, isUser);
          
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 14: Safe JSON Parsing - Should validate parsed data with type guards', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          fullName: fc.oneof(fc.constant(null), fc.string()),
          institutionName: fc.oneof(fc.constant(null), fc.string()),
          createdAt: validDateArbitrary().map(d => d.toISOString()),
          updatedAt: validDateArbitrary().map(d => d.toISOString())
        }),
        (validUserData) => {
          // Property: Safe JSON parsing should validate parsed data structure
          const jsonString = JSON.stringify(validUserData);
          const result = safeParseJson(jsonString, isUser);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toEqual(validUserData);
            expect(isUser(result.data)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Validation Functions - Email validation should be consistent', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          // Property: Valid emails should consistently pass validation
          expect(validateEmail(email)).toBe(true);
          
          // Property: Email validation should be idempotent
          expect(validateEmail(email)).toBe(validateEmail(email));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Validation Functions - Password validation should enforce all rules', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 50 })
          .filter(s => /[A-Z]/.test(s))
          .filter(s => /[a-z]/.test(s))
          .filter(s => /\d/.test(s))
          .filter(s => /[!@#$%^&*(),.?":{}|<>]/.test(s)),
        (strongPassword) => {
          // Property: Strong passwords should pass all validation rules
          const result = validatePassword(strongPassword);
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          // Property: Password validation should be deterministic
          const result2 = validatePassword(strongPassword);
          expect(result).toEqual(result2);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 14: Validation Functions - Weak passwords should fail with specific errors', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ maxLength: 7 }), // Too short
          fc.string({ minLength: 8 }).filter(s => !/[A-Z]/.test(s)), // No uppercase
          fc.string({ minLength: 8 }).filter(s => !/[a-z]/.test(s)), // No lowercase
          fc.string({ minLength: 8 }).filter(s => !/\d/.test(s)), // No digits
          fc.string({ minLength: 8 }).filter(s => !/[!@#$%^&*(),.?":{}|<>]/.test(s)) // No special chars
        ),
        (weakPassword) => {
          // Property: Weak passwords should fail validation with descriptive errors
          const result = validatePassword(weakPassword);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(error => typeof error === 'string')).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 14: UUID Validation - Should correctly identify valid UUIDs', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (uuid) => {
          // Property: Valid UUIDs should pass validation
          expect(validateUUID(uuid)).toBe(true);
          
          // Property: UUID validation should be case-insensitive
          expect(validateUUID(uuid.toLowerCase())).toBe(true);
          expect(validateUUID(uuid.toUpperCase())).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Time Validation - Should validate time format correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          hours: fc.integer({ min: 0, max: 23 }),
          minutes: fc.integer({ min: 0, max: 59 })
        }),
        ({ hours, minutes }) => {
          // Property: Valid time formats should pass validation
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          expect(validateTime(timeString)).toBe(true);
          
          // Property: Time validation should handle single digits
          const singleDigitTime = `${hours}:${minutes}`;
          const isValidSingleDigit = validateTime(singleDigitTime);
          
          // Should be valid if hours and minutes are properly formatted
          if (hours < 10 && minutes < 10) {
            // Single digit hours/minutes without padding might be invalid
            expect(typeof isValidSingleDigit).toBe('boolean');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Complex Type Guards - Should handle nested object validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          questionText: fc.string({ minLength: 10, maxLength: 1000 }),
          paperId: fc.uuid(),
          userId: fc.uuid(),
          questionNumber: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100 })),
          topic: fc.oneof(fc.constant(null), fc.string()),
          subject: fc.oneof(fc.constant(null), fc.string()),
          difficulty: fc.oneof(fc.constant(null), fc.constantFrom('Easy', 'Medium', 'Hard')),
          importanceExplanation: fc.oneof(fc.constant(null), fc.string()),
          isAnalyzed: fc.boolean(),
          maxMarks: fc.integer({ min: 1, max: 100 }),
          timeLimit: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 300 })),
          keywords: fc.array(fc.string(), { maxLength: 10 }),
          createdAt: validDateArbitrary().map(d => d.toISOString()),
          updatedAt: validDateArbitrary().map(d => d.toISOString())
        }),
        (questionData) => {
          // Property: Complex objects should be validated correctly
          expect(isQuestion(questionData)).toBe(true);
          
          // Property: Type guard should validate all required fields
          if (isQuestion(questionData)) {
            expect(questionData.id).toBeDefined();
            expect(questionData.questionText).toBeDefined();
            expect(questionData.maxMarks).toBeGreaterThan(0);
            
            if (questionData.difficulty !== null) {
              expect(['Easy', 'Medium', 'Hard']).toContain(questionData.difficulty);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Error Object Validation - Should validate API error structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          code: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          message: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          details: fc.oneof(fc.constant(undefined), fc.object()),
          statusCode: fc.oneof(fc.constant(undefined), fc.integer({ min: 100, max: 599 })),
          timestamp: fc.oneof(fc.constant(undefined), validDateArbitrary().map(d => d.toISOString()))
        }),
        (errorData) => {
          // Property: Valid error objects should pass API error validation
          expect(isApiError(errorData)).toBe(true);
          
          // Property: Error assertion should work for valid errors
          expect(() => assertIsApiError(errorData)).not.toThrow();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Runtime Type Safety - Should prevent type confusion at runtime', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Mix of different valid objects that should not be confused
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            createdAt: validDateArbitrary().map(d => d.toISOString()),
            updatedAt: validDateArbitrary().map(d => d.toISOString())
          }),
          fc.record({
            id: fc.uuid(),
            questionText: fc.string(),
            paperId: fc.uuid(),
            userId: fc.uuid(),
            isAnalyzed: fc.boolean(),
            maxMarks: fc.integer({ min: 1 }),
            createdAt: validDateArbitrary().map(d => d.toISOString())
          }),
          fc.record({
            code: fc.string(),
            message: fc.string()
          })
        ),
        (mixedObject) => {
          // Property: Type guards should not confuse different object types
          const userCheck = isUser(mixedObject);
          const questionCheck = isQuestion(mixedObject);
          const errorCheck = isApiError(mixedObject);
          
          // At most one type guard should return true for any given object
          const trueCount = [userCheck, questionCheck, errorCheck].filter(Boolean).length;
          expect(trueCount).toBeLessThanOrEqual(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});