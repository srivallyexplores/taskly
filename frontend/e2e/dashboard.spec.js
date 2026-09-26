import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/total tasks/i)).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();
  });

  test('should show productivity stats', async ({ page }) => {
    await expect(page.getByText(/productivity/i)).toBeVisible();
    await expect(page.getByTestId('productivity-chart')).toBeVisible();
    await expect(page.getByText(/completion rate/i)).toBeVisible();
  });

  test('should display recent tasks', async ({ page }) => {
    await expect(page.getByText(/recent tasks/i)).toBeVisible();
    await expect(page.getByTestId('recent-task')).toHaveCount.greaterThan(0);
  });

  test('should show quick actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create task/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /view all tasks/i })).toBeVisible();
  });

  test('should navigate to tasks from quick action', async ({ page }) => {
    await page.getByRole('button', { name: /view all tasks/i }).click();
    await expect(page).toHaveURL('/tasks');
  });

  test('should open create task modal from quick action', async ({ page }) => {
    await page.getByRole('button', { name: /create task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create task/i })).toBeVisible();
  });

  test('should display achievement notifications', async ({ page }) => {
    // Assuming there are achievement notifications
    const notifications = page.getByTestId('achievement-notification');
    if (await notifications.count() > 0) {
      await expect(notifications.first()).toBeVisible();
    }
  });

  test('should show level progress', async ({ page }) => {
    await expect(page.getByText(/level/i)).toBeVisible();
    await expect(page.getByTestId('level-progress')).toBeVisible();
    await expect(page.getByText(/xp/i)).toBeVisible();
  });

  test('should display upcoming deadlines', async ({ page }) => {
    await expect(page.getByText(/upcoming deadlines/i)).toBeVisible();
    const deadlineItems = page.getByTestId('deadline-item');
    if (await deadlineItems.count() > 0) {
      await expect(deadlineItems.first()).toBeVisible();
    }
  });

  test('should show team activity feed', async ({ page }) => {
    await expect(page.getByText(/team activity/i)).toBeVisible();
    const activityItems = page.getByTestId('activity-item');
    if (await activityItems.count() > 0) {
      await expect(activityItems.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile navigation
    await expect(page.getByTestId('mobile-nav')).toBeVisible();
    
    // Check dashboard content is still accessible
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText(/total tasks/i)).toBeVisible();
  });

  test('should handle dark mode toggle', async ({ page }) => {
    // Toggle dark mode
    await page.getByRole('button', { name: /theme/i }).click();
    
    // Verify dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Toggle back to light mode
    await page.getByRole('button', { name: /theme/i }).click();
    
    // Verify light mode is restored
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});