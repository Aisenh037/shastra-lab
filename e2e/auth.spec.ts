import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Check that we're on the landing page
    await expect(page).toHaveTitle(/ShastraLab/);
    
    // Should see sign in/get started buttons
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to auth page when clicking sign in', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Should navigate to auth page
    await expect(page).toHaveURL('/auth');
    
    // Should see email and password fields
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
});