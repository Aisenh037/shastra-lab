import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { glob } from 'glob';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Property-based tests for testing infrastructure completeness
 * Feature: industry-grade-improvements, Property 1: Comprehensive Test Coverage
 */

describe('Testing Infrastructure Properties', () => {
  it('Property 1: Comprehensive Test Coverage - All utility functions should have corresponding test files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('src'),
        async (srcDir) => {
          // Find all utility and hook files
          const utilFiles = await glob('src/lib/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
          const hookFiles = await glob('src/hooks/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
          const allFiles = [...utilFiles, ...hookFiles];

          // For each source file, verify a test file exists
          for (const file of allFiles) {
            const testFile = file.replace(/\.ts$/, '.test.ts');
            const specFile = file.replace(/\.ts$/, '.spec.ts');
            
            const hasTestFile = existsSync(testFile) || existsSync(specFile);
            
            if (!hasTestFile) {
              throw new Error(`Missing test file for ${file}. Expected ${testFile} or ${specFile}`);
            }
          }

          return true;
        }
      ),
      { numRuns: 1 } // Single run since this is a structural property
    );
  });

  it('Property 1: Component Test Coverage - All React components should have test files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('src/components'),
        async (componentsDir) => {
          // Find all component files
          const componentFiles = await glob('src/components/**/*.tsx', { 
            ignore: ['**/*.test.tsx', '**/*.spec.tsx'] 
          });
          const pageFiles = await glob('src/pages/**/*.tsx', { 
            ignore: ['**/*.test.tsx', '**/*.spec.tsx'] 
          });
          const allComponents = [...componentFiles, ...pageFiles];

          // For each component, verify a test file exists
          for (const file of allComponents) {
            const testFile = file.replace(/\.tsx$/, '.test.tsx');
            const specFile = file.replace(/\.tsx$/, '.spec.tsx');
            
            const hasTestFile = existsSync(testFile) || existsSync(specFile);
            
            if (!hasTestFile) {
              throw new Error(`Missing test file for ${file}. Expected ${testFile} or ${specFile}`);
            }
          }

          return true;
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 1: E2E Test Coverage - Critical user journeys should have E2E tests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(['auth', 'dashboard', 'written-practice']),
        async (criticalJourneys) => {
          // Verify E2E tests exist for critical journeys
          for (const journey of criticalJourneys) {
            const e2eFile = `e2e/${journey}.spec.ts`;
            
            if (!existsSync(e2eFile)) {
              throw new Error(`Missing E2E test for critical journey: ${journey}. Expected ${e2eFile}`);
            }
          }

          return true;
        }
      ),
      { numRuns: 1 }
    );
  });

  it('Property 1: Test Configuration Completeness - Testing framework should be properly configured', () => {
    fc.assert(
      fc.property(
        fc.constant(['vitest.config.ts', 'playwright.config.ts']),
        (configFiles) => {
          // Verify test configuration files exist
          for (const configFile of configFiles) {
            if (!existsSync(configFile)) {
              throw new Error(`Missing test configuration file: ${configFile}`);
            }
          }

          return true;
        }
      ),
      { numRuns: 1 }
    );
  });
});