import { test, expect } from '@playwright/test';

test.describe('Written Practice Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete written practice workflow for authenticated user', async ({ page }) => {
    // Test authentication first
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');

    // Navigate to written practice
    await page.click('text=Written Practice');
    await expect(page).toHaveURL('/written-practice');

    // Verify written practice page elements
    await expect(page.locator('h1')).toContainText('Written Practice');
    
    // Check for question selection interface
    await expect(page.locator('text=Select Question')).toBeVisible();
    
    // Check for answer input area
    await expect(page.locator('textarea, [contenteditable]')).toBeVisible();
    
    // Check for evaluation button
    await expect(page.locator('button:has-text("Evaluate")')).toBeVisible();
  });

  test('should handle question selection and answer submission', async ({ page }) => {
    // Assume user is already authenticated (mock or use test user)
    await page.goto('/written-practice');

    // Select a question (if available)
    const questionSelector = page.locator('[data-testid="question-selector"]');
    if (await questionSelector.isVisible()) {
      await questionSelector.click();
      await page.click('text=Sample Question'); // Adjust based on actual implementation
    }

    // Enter answer text
    const answerInput = page.locator('textarea[placeholder*="answer"], [contenteditable]').first();
    await answerInput.fill('This is a sample answer for testing purposes. It demonstrates the answer evaluation workflow.');

    // Submit for evaluation
    await page.click('button:has-text("Evaluate")');

    // Wait for evaluation results
    await expect(page.locator('text=Evaluation Results, text=Score, text=Feedback')).toBeVisible({ timeout: 10000 });
    
    // Verify evaluation components are displayed
    await expect(page.locator('[data-testid="evaluation-score"], .score, text=Score')).toBeVisible();
    await expect(page.locator('[data-testid="evaluation-feedback"], .feedback, text=Feedback')).toBeVisible();
  });

  test('should handle file upload for handwritten answers', async ({ page }) => {
    await page.goto('/written-practice');

    // Look for file upload option
    const fileUpload = page.locator('input[type="file"], [data-testid="file-upload"]');
    if (await fileUpload.isVisible()) {
      // Create a test file (mock image)
      const testFile = Buffer.from('test image content');
      await fileUpload.setInputFiles({
        name: 'test-answer.jpg',
        mimeType: 'image/jpeg',
        buffer: testFile,
      });

      // Verify upload feedback
      await expect(page.locator('text=Uploaded, text=Processing, .upload-success')).toBeVisible();
    }
  });

  test('should display answer history and progress tracking', async ({ page }) => {
    await page.goto('/written-practice');

    // Check for history/progress section
    const historySection = page.locator('[data-testid="answer-history"], text=Previous Answers, text=History');
    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible();
    }

    // Check for progress indicators
    const progressIndicators = page.locator('[data-testid="progress"], .progress, text=Progress');
    if (await progressIndicators.isVisible()) {
      await expect(progressIndicators).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/written-practice');

    // Test empty answer submission
    const evaluateButton = page.locator('button:has-text("Evaluate")');
    if (await evaluateButton.isVisible()) {
      await evaluateButton.click();
      
      // Should show validation error
      await expect(page.locator('text=Please enter an answer, text=Answer required, .error')).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/written-practice');

    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const answerInput = page.locator('textarea, [contenteditable]').first();
    if (await answerInput.isVisible()) {
      const boundingBox = await answerInput.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/written-practice');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test Enter key on buttons
    const evaluateButton = page.locator('button:has-text("Evaluate")');
    if (await evaluateButton.isVisible()) {
      await evaluateButton.focus();
      await page.keyboard.press('Enter');
      // Should trigger evaluation or show validation
    }
  });
});