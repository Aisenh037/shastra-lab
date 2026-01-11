import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

/**
 * Property-based tests for TypeScript strict configuration
 * Feature: industry-grade-improvements, Property 9: Strict TypeScript Compilation
 */

describe('TypeScript Strict Configuration Properties', () => {
  it('Property 9: Strict TypeScript Compilation - Should have zero compilation errors with strict mode', () => {
    fc.assert(
      fc.property(
        fc.constant('typescript-compilation'),
        () => {
          // Property: TypeScript compilation should produce zero errors in strict mode
          try {
            // Run TypeScript compiler with no emit to check for errors
            const result = execSync('npx tsc --noEmit --strict', { 
              encoding: 'utf8',
              timeout: 30000 // 30 second timeout
            });
            
            // If we reach here, compilation succeeded
            expect(result).toBeDefined();
            return true;
          } catch (error: any) {
            // If compilation fails, the error output contains the issues
            const errorOutput = error.stdout || error.stderr || error.message;
            
            // Fail the test with detailed error information
            throw new Error(`TypeScript strict compilation failed:\n${errorOutput}`);
          }
        }
      ),
      { numRuns: 1 } // Single run since this is a compilation check
    );
  });

  it('Property 9: TypeScript Configuration Validation - Should have strict mode enabled in all config files', () => {
    fc.assert(
      fc.property(
        fc.constant(['tsconfig.json', 'tsconfig.app.json']),
        (configFiles) => {
          // Property: All TypeScript config files should have strict mode enabled
          for (const configFile of configFiles) {
            if (!existsSync(configFile)) {
              throw new Error(`TypeScript config file ${configFile} does not exist`);
            }
            
            const configContent = readFileSync(configFile, 'utf8');
            
            // Instead of parsing JSON, check for strict mode indicators in the content
            const hasStrictTrue = configContent.includes('"strict": true');
            const hasNoImplicitAny = configContent.includes('"noImplicitAny": true');
            const hasStrictNullChecks = configContent.includes('"strictNullChecks": true');
            
            if (!hasStrictTrue && !(hasNoImplicitAny && hasStrictNullChecks)) {
              throw new Error(`${configFile} does not have strict mode enabled`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 9: No Implicit Any Types - Should not have any implicit any types in codebase', () => {
    fc.assert(
      fc.property(
        fc.constant('no-implicit-any-check'),
        () => {
          // Property: Codebase should not contain implicit any types
          try {
            // Run TypeScript with noImplicitAny flag specifically
            const result = execSync('npx tsc --noEmit --noImplicitAny --strict', { 
              encoding: 'utf8',
              timeout: 30000
            });
            
            // Success means no implicit any types found
            return true;
          } catch (error: any) {
            const errorOutput = error.stdout || error.stderr || error.message;
            
            // Check if the error is specifically about implicit any
            if (errorOutput.includes('implicitly has an \'any\' type')) {
              throw new Error(`Found implicit any types in codebase:\n${errorOutput}`);
            }
            
            // Other TypeScript errors are handled by other tests
            throw new Error(`TypeScript compilation failed:\n${errorOutput}`);
          }
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 9: Strict Null Checks - Should handle null and undefined properly', () => {
    fc.assert(
      fc.property(
        fc.constant('strict-null-checks'),
        () => {
          // Property: Code should handle null and undefined values properly with strict null checks
          try {
            // Run TypeScript with strictNullChecks specifically
            const result = execSync('npx tsc --noEmit --strictNullChecks --strict', { 
              encoding: 'utf8',
              timeout: 30000
            });
            
            return true;
          } catch (error: any) {
            const errorOutput = error.stdout || error.stderr || error.message;
            
            // Check for null/undefined related errors
            if (errorOutput.includes('possibly \'null\'') || 
                errorOutput.includes('possibly \'undefined\'')) {
              throw new Error(`Found null/undefined safety issues:\n${errorOutput}`);
            }
            
            throw new Error(`TypeScript compilation failed:\n${errorOutput}`);
          }
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 9: No Unused Variables - Should not have unused variables or parameters', () => {
    fc.assert(
      fc.property(
        fc.constant('no-unused-check'),
        () => {
          // Property: Code should not have unused variables or parameters
          try {
            // Run TypeScript with unused variable checks
            const result = execSync('npx tsc --noEmit --noUnusedLocals --noUnusedParameters --strict', { 
              encoding: 'utf8',
              timeout: 30000
            });
            
            return true;
          } catch (error: any) {
            const errorOutput = error.stdout || error.stderr || error.message;
            
            // Check for unused variable/parameter errors
            if (errorOutput.includes('is declared but never used') ||
                errorOutput.includes('is declared but its value is never read')) {
              throw new Error(`Found unused variables or parameters:\n${errorOutput}`);
            }
            
            throw new Error(`TypeScript compilation failed:\n${errorOutput}`);
          }
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 9: Type Definition Files - Should have comprehensive type definitions', () => {
    fc.assert(
      fc.property(
        fc.constant(['src/types/api.ts', 'src/types/state.ts', 'src/utils/type-guards.ts']),
        (typeFiles) => {
          // Property: Essential type definition files should exist and be valid
          for (const typeFile of typeFiles) {
            if (!existsSync(typeFile)) {
              throw new Error(`Type definition file ${typeFile} does not exist`);
            }
            
            const content = readFileSync(typeFile, 'utf8');
            
            // Basic validation that files contain type definitions
            if (!content.includes('interface') && 
                !content.includes('type ') && 
                !content.includes('export')) {
              throw new Error(`${typeFile} does not appear to contain type definitions`);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 9: Import/Export Type Safety - Should use proper type imports and exports', () => {
    fc.assert(
      fc.property(
        fc.constant('type-import-export-check'),
        () => {
          // Property: Type imports and exports should be properly structured
          try {
            // Compile with isolatedModules to catch import/export issues
            const result = execSync('npx tsc --noEmit --isolatedModules --strict', { 
              encoding: 'utf8',
              timeout: 30000
            });
            
            return true;
          } catch (error: any) {
            const errorOutput = error.stdout || error.stderr || error.message;
            
            if (errorOutput.includes('Cannot re-export a type when') ||
                errorOutput.includes('This module can only be referenced')) {
              throw new Error(`Found type import/export issues:\n${errorOutput}`);
            }
            
            throw new Error(`TypeScript compilation failed:\n${errorOutput}`);
          }
        }
      ),
      { numRuns: 1 }
    );
  });
});