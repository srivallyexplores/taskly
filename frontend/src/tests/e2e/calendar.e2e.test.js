import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test data
const TEST_TASK = {
  title: 'E2E Test Task',
  description: 'This is a test task created during E2E testing',
  priority: 'high',
  tags: ['testing', 'e2e']
};

test.describe('Calendar End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Login if required
    const loginButton = page.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await loginButton.click();
      await page.waitForURL('**/dashboard');
    }
    
    // Navigate to calendar
    await page.click('[data-testid="calendar-nav-link"]');
    await page.waitForURL('**/calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Calendar Navigation and Views', () => {
    test('should load calendar with default month view', async ({ page }) => {
      // Check that calendar is loaded
      await expect(page.locator('[data-testid="calendar-container"]')).toBeVisible();
      
      // Check that month view is active
      await expect(page.locator('[data-testid="view-selector"]')).toHaveText(/month/i);
      
      // Check that calendar grid is visible
      await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible();
      
      // Check that navigation controls are present
      await expect(page.locator('[data-testid="prev-month-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-month-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="today-button"]')).toBeVisible();
    });

    test('should switch between different calendar views', async ({ page }) => {
      // Test month view
      await page.click('[data-testid="month-view-button"]');
      await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
      
      // Test week view
      await page.click('[data-testid="week-view-button"]');
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-slots"]')).toBeVisible();
      
      // Test day view
      await page.click('[data-testid="day-view-button"]');
      await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="hourly-timeline"]')).toBeVisible();
      
      // Test agenda view
      await page.click('[data-testid="agenda-view-button"]');
      await expect(page.locator('[data-testid="agenda-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
      // Get current month
      const currentMonth = await page.locator('[data-testid="current-month"]').textContent();
      
      // Navigate to next month
      await page.click('[data-testid="next-month-button"]');
      await page.waitForTimeout(500);
      const nextMonth = await page.locator('[data-testid="current-month"]').textContent();
      expect(nextMonth).not.toBe(currentMonth);
      
      // Navigate to previous month
      await page.click('[data-testid="prev-month-button"]');
      await page.waitForTimeout(500);
      const prevMonth = await page.locator('[data-testid="current-month"]').textContent();
      expect(prevMonth).toBe(currentMonth);
      
      // Navigate to today
      await page.click('[data-testid="today-button"]');
      await page.waitForTimeout(500);
      const todayMonth = await page.locator('[data-testid="current-month"]').textContent();
      expect(todayMonth).toBe(currentMonth);
    });

    test('should persist view selection across page reloads', async ({ page }) => {
      // Switch to week view
      await page.click('[data-testid="week-view-button"]');
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that week view is still active
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
    });
  });

  test.describe('Task Creation and Management', () => {
    test('should create a new task from calendar', async ({ page }) => {
      // Click on a date cell to create task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      
      // Check that quick create modal opens
      await expect(page.locator('[data-testid="task-quick-create"]')).toBeVisible();
      
      // Fill in task details
      await page.fill('[data-testid="task-title-input"]', TEST_TASK.title);
      await page.fill('[data-testid="task-description-input"]', TEST_TASK.description);
      await page.selectOption('[data-testid="task-priority-select"]', TEST_TASK.priority);
      
      // Add tags
      for (const tag of TEST_TASK.tags) {
        await page.fill('[data-testid="task-tags-input"]', tag);
        await page.press('[data-testid="task-tags-input"]', 'Enter');
      }
      
      // Save task
      await page.click('[data-testid="save-task-button"]');
      
      // Wait for task to be created
      await page.waitForTimeout(1000);
      
      // Check that task appears in calendar
      await expect(page.locator(`[data-testid="task-card"]:has-text("${TEST_TASK.title}")`)).toBeVisible();
    });

    test('should edit task from calendar', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', TEST_TASK.title);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Click on the task to edit
      await page.click(`[data-testid="task-card"]:has-text("${TEST_TASK.title}")`);
      
      // Check that task details modal opens
      await expect(page.locator('[data-testid="task-details-modal"]')).toBeVisible();
      
      // Click edit button
      await page.click('[data-testid="edit-task-button"]');
      
      // Update task title
      const updatedTitle = `${TEST_TASK.title} - Updated`;
      await page.fill('[data-testid="task-title-input"]', updatedTitle);
      
      // Save changes
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Check that task is updated
      await expect(page.locator(`[data-testid="task-card"]:has-text("${updatedTitle}")`)).toBeVisible();
    });

    test('should drag and drop task to different date', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', TEST_TASK.title);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Get source and target date cells
      const sourceCell = page.locator('[data-testid="calendar-date-cell"]:first-child');
      const targetCell = page.locator('[data-testid="calendar-date-cell"]:nth-child(3)');
      
      // Drag task from source to target
      const taskCard = page.locator(`[data-testid="task-card"]:has-text("${TEST_TASK.title}")`);
      await taskCard.dragTo(targetCell);
      
      // Wait for drag operation to complete
      await page.waitForTimeout(1000);
      
      // Check that task moved to new date
      const targetCellTasks = targetCell.locator('[data-testid="task-card"]');
      await expect(targetCellTasks.filter({ hasText: TEST_TASK.title })).toBeVisible();
    });

    test('should complete task from calendar', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', TEST_TASK.title);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Hover over task to show actions
      const taskCard = page.locator(`[data-testid="task-card"]:has-text("${TEST_TASK.title}")`);
      await taskCard.hover();
      
      // Click complete button
      await page.click('[data-testid="complete-task-button"]');
      await page.waitForTimeout(1000);
      
      // Check that task is marked as completed
      await expect(taskCard.locator('[data-testid="task-status-completed"]')).toBeVisible();
    });

    test('should delete task from calendar', async ({ page }) => {
      // First create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', TEST_TASK.title);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Right-click on task to show context menu
      const taskCard = page.locator(`[data-testid="task-card"]:has-text("${TEST_TASK.title}")`);
      await taskCard.click({ button: 'right' });
      
      // Click delete option
      await page.click('[data-testid="delete-task-option"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      await page.waitForTimeout(1000);
      
      // Check that task is removed
      await expect(taskCard).not.toBeVisible();
    });
  });

  test.describe('Calendar Filtering and Search', () => {
    test('should filter tasks by priority', async ({ page }) => {
      // Create tasks with different priorities
      const priorities = ['high', 'medium', 'low'];
      for (const priority of priorities) {
        await page.click('[data-testid="calendar-date-cell"]:first-child');
        await page.fill('[data-testid="task-title-input"]', `${priority} priority task`);
        await page.selectOption('[data-testid="task-priority-select"]', priority);
        await page.click('[data-testid="save-task-button"]');
        await page.waitForTimeout(500);
      }
      
      // Open filters
      await page.click('[data-testid="filters-button"]');
      
      // Filter by high priority only
      await page.uncheck('[data-testid="priority-medium-filter"]');
      await page.uncheck('[data-testid="priority-low-filter"]');
      
      // Check that only high priority task is visible
      await expect(page.locator('[data-testid="task-card"]:has-text("high priority")')).toBeVisible();
      await expect(page.locator('[data-testid="task-card"]:has-text("medium priority")')).not.toBeVisible();
      await expect(page.locator('[data-testid="task-card"]:has-text("low priority")')).not.toBeVisible();
    });

    test('should search for tasks', async ({ page }) => {
      // Create a test task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Searchable Task');
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Open search
      await page.click('[data-testid="search-button"]');
      
      // Search for the task
      await page.fill('[data-testid="search-input"]', 'Searchable');
      await page.waitForTimeout(500);
      
      // Check that search results appear
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-result"]:has-text("Searchable Task")')).toBeVisible();
      
      // Click on search result
      await page.click('[data-testid="search-result"]:has-text("Searchable Task")');
      
      // Check that task is highlighted in calendar
      await expect(page.locator('[data-testid="task-card"].highlighted:has-text("Searchable Task")')).toBeVisible();
    });
  });

  test.describe('Calendar Notifications and Reminders', () => {
    test('should show overdue task notifications', async ({ page }) => {
      // Create a task with past due date
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Overdue Task');
      
      // Set due date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await page.fill('[data-testid="task-due-date-input"]', yesterday.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Check that overdue notification appears
      await expect(page.locator('[data-testid="overdue-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="overdue-task-count"]')).toHaveText('1');
    });

    test('should show today\'s tasks indicator', async ({ page }) => {
      // Create a task for today
      await page.click('[data-testid="today-date-cell"]');
      await page.fill('[data-testid="task-title-input"]', 'Today Task');
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Check that today's tasks indicator is visible
      await expect(page.locator('[data-testid="today-tasks-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="today-task-count"]')).toHaveText('1');
    });
  });

  test.describe('Calendar Preferences and Settings', () => {
    test('should open and modify calendar preferences', async ({ page }) => {
      // Open preferences
      await page.click('[data-testid="calendar-settings-button"]');
      
      // Check that preferences panel opens
      await expect(page.locator('[data-testid="preferences-panel"]')).toBeVisible();
      
      // Change default view
      await page.selectOption('[data-testid="default-view-select"]', 'week');
      
      // Change start of week
      await page.selectOption('[data-testid="start-of-week-select"]', '1'); // Monday
      
      // Enable compact mode
      await page.check('[data-testid="compact-mode-checkbox"]');
      
      // Save preferences
      await page.click('[data-testid="save-preferences-button"]');
      await page.waitForTimeout(1000);
      
      // Reload page to check persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that preferences are applied
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-container"].compact')).toBeVisible();
    });

    test('should export and import calendar preferences', async ({ page }) => {
      // Open preferences
      await page.click('[data-testid="calendar-settings-button"]');
      
      // Export preferences
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-preferences-button"]')
      ]);
      
      // Check that file was downloaded
      expect(download.suggestedFilename()).toMatch(/calendar-preferences.*\.json/);
      
      // Save the downloaded file
      const path = await download.path();
      expect(path).toBeTruthy();
      
      // Import preferences (simulate file upload)
      await page.setInputFiles('[data-testid="import-preferences-input"]', path);
      
      // Check that import success message appears
      await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that mobile layout is applied
      await expect(page.locator('[data-testid="calendar-container"].mobile')).toBeVisible();
      
      // Check that mobile navigation works
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test swipe navigation (simulate touch events)
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(100, 300);
      
      // Check that calendar navigated
      await page.waitForTimeout(500);
    });

    test('should support touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Create a task
      await page.touchscreen.tap(200, 400); // Tap on date cell
      await page.fill('[data-testid="task-title-input"]', 'Mobile Task');
      await page.touchscreen.tap(200, 500); // Tap save button
      await page.waitForTimeout(1000);
      
      // Test long press for context menu
      const taskCard = page.locator('[data-testid="task-card"]:has-text("Mobile Task")');
      await taskCard.click({ delay: 1000 }); // Long press
      
      // Check that context menu appears
      await expect(page.locator('[data-testid="mobile-context-menu"]')).toBeVisible();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in different browsers', async ({ page, browserName }) => {
      // This test will run in all configured browsers
      console.log(`Testing in ${browserName}`);
      
      // Basic functionality test
      await expect(page.locator('[data-testid="calendar-container"]')).toBeVisible();
      
      // Create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `${browserName} Test Task`);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(1000);
      
      // Check that task appears
      await expect(page.locator(`[data-testid="task-card"]:has-text("${browserName} Test Task")`)).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load calendar within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/calendar`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Calendar should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large number of tasks efficiently', async ({ page }) => {
      // Create many tasks
      const taskCount = 50;
      for (let i = 0; i < taskCount; i++) {
        await page.click('[data-testid="calendar-date-cell"]:first-child');
        await page.fill('[data-testid="task-title-input"]', `Performance Test Task ${i}`);
        await page.click('[data-testid="save-task-button"]');
        
        // Don't wait for every task to avoid test timeout
        if (i % 10 === 0) {
          await page.waitForTimeout(500);
        }
      }
      
      // Check that calendar still responds
      const startTime = Date.now();
      await page.click('[data-testid="next-month-button"]');
      await page.waitForTimeout(500);
      const responseTime = Date.now() - startTime;
      
      // Navigation should still be responsive
      expect(responseTime).toBeLessThan(1000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/tasks/**', route => route.abort());
      
      // Try to create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Network Error Test');
      await page.click('[data-testid="save-task-button"]');
      
      // Check that error message appears
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/network error|failed to save/i);
    });

    test('should recover from temporary failures', async ({ page }) => {
      let requestCount = 0;
      
      // Fail first request, succeed on retry
      await page.route('**/api/tasks', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Try to create a task
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Recovery Test');
      await page.click('[data-testid="save-task-button"]');
      
      // Wait for retry
      await page.waitForTimeout(2000);
      
      // Check that task was eventually created
      await expect(page.locator('[data-testid="task-card"]:has-text("Recovery Test")')).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up any test data
    const testTasks = page.locator('[data-testid="task-card"]').filter({
      hasText: /test|Test|TEST/
    });
    
    const count = await testTasks.count();
    for (let i = 0; i < count; i++) {
      try {
        await testTasks.nth(i).click({ button: 'right' });
        await page.click('[data-testid="delete-task-option"]');
        await page.click('[data-testid="confirm-delete-button"]');
        await page.waitForTimeout(200);
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Failed to clean up test task:', error);
      }
    }
  });
});