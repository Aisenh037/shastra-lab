import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in a real scenario, you'd set up proper test auth
    await page.goto('/dashboard');
  });

  test('should display dashboard stats cards', async ({ page }) => {
    // Check for stats cards
    await expect(page.getByText('Total Papers')).toBeVisible();
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByText('Analyzed')).toBeVisible();
    await expect(page.getByText('Syllabi')).toBeVisible();
  });

  test('should display charts when data is available', async ({ page }) => {
    // Check for chart containers
    await expect(page.getByText('Difficulty Distribution')).toBeVisible();
    await expect(page.getByText('Top Topics')).toBeVisible();
  });

  test('should display quick action buttons', async ({ page }) => {
    // Check for quick action buttons
    await expect(page.getByRole('link', { name: /analyze new paper/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /manage syllabi/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /view question bank/i })).toBeVisible();
  });

  test('should navigate to correct pages when clicking quick actions', async ({ page }) => {
    // Test navigation to analyze page
    await page.getByRole('link', { name: /analyze new paper/i }).click();
    await expect(page).toHaveURL('/analyze');
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Test navigation to syllabi page
    await page.getByRole('link', { name: /manage syllabi/i }).click();
    await expect(page).toHaveURL('/syllabi');
  });
});