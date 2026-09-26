import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display tasks page', async ({ page }) => {
    await page.getByRole('link', { name: /tasks/i }).click();
    
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create task/i })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Open create task modal
    await page.getByRole('button', { name: /create task/i }).click();
    
    // Fill task form
    await page.getByLabel(/title/i).fill('Test Task');
    await page.getByLabel(/description/i).fill('This is a test task description');
    await page.getByLabel(/priority/i).selectOption('high');
    await page.getByLabel(/due date/i).fill('2024-12-31');
    
    // Submit form
    await page.getByRole('button', { name: /create/i }).click();
    
    // Verify task was created
    await expect(page.getByText('Test Task')).toBeVisible();
    await expect(page.getByText('This is a test task description')).toBeVisible();
    await expect(page.getByText(/high/i)).toBeVisible();
  });

  test('should edit an existing task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click on first task to edit
    await page.getByTestId('task-card').first().click();
    
    // Edit task details
    await page.getByLabel(/title/i).clear();
    await page.getByLabel(/title/i).fill('Updated Task Title');
    await page.getByLabel(/priority/i).selectOption('medium');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify changes
    await expect(page.getByText('Updated Task Title')).toBeVisible();
    await expect(page.getByText(/medium/i)).toBeVisible();
  });

  test('should complete a task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Find and complete a task
    const taskCard = page.getByTestId('task-card').first();
    await taskCard.getByRole('button', { name: /complete/i }).click();
    
    // Verify task is marked as completed
    await expect(taskCard).toHaveClass(/completed/);
    await expect(taskCard.getByText(/completed/i)).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('/tasks');
    
    const taskTitle = await page.getByTestId('task-card').first().getByTestId('task-title').textContent();
    
    // Delete task
    await page.getByTestId('task-card').first().getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify task is removed
    await expect(page.getByText(taskTitle)).not.toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/tasks');
    
    // Filter by completed tasks
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('option', { name: /completed/i }).click();
    
    // Verify only completed tasks are shown
    const taskCards = page.getByTestId('task-card');
    await expect(taskCards.first()).toHaveClass(/completed/);
  });

  test('should search tasks', async ({ page }) => {
    await page.goto('/tasks');
    
    // Search for specific task
    await page.getByPlaceholder(/search tasks/i).fill('Test Task');
    
    // Verify search results
    await expect(page.getByText('Test Task')).toBeVisible();
    await expect(page.getByTestId('task-card')).toHaveCount(1);
  });

  test('should sort tasks by due date', async ({ page }) => {
    await page.goto('/tasks');
    
    // Change sort order
    await page.getByRole('button', { name: /sort/i }).click();
    await page.getByRole('option', { name: /due date/i }).click();
    
    // Verify tasks are sorted by due date
    const taskCards = page.getByTestId('task-card');
    const firstTaskDate = await taskCards.first().getByTestId('due-date').textContent();
    const secondTaskDate = await taskCards.nth(1).getByTestId('due-date').textContent();
    
    expect(new Date(firstTaskDate) <= new Date(secondTaskDate)).toBeTruthy();
  });

  test('should show task details in modal', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click on task to view details
    await page.getByTestId('task-card').first().click();
    
    // Verify modal is open with task details
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /task details/i })).toBeVisible();
  });
});