import { test, expect } from '@playwright/test';

// User journey test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'journey-test@example.com',
  password: 'journeytest123',
  name: 'Journey Test User'
};

test.describe('Calendar User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login or register test user
    try {
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard', { timeout: 5000 });
    } catch {
      // If login fails, try to register
      await page.click('[data-testid="register-link"]');
      await page.fill('[data-testid="name-input"]', TEST_USER.name);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="register-button"]');
      await page.waitForURL('**/dashboard', { timeout: 5000 });
    }
    
    // Navigate to calendar
    await page.click('[data-testid="calendar-nav-link"]');
    await page.waitForURL('**/calendar');
    await page.waitForLoadState('networkidle');
  });

  test.describe('New User Onboarding Journey', () => {
    test('should guide new user through calendar features', async ({ page }) => {
      // Check if onboarding tour starts
      const tourModal = page.locator('[data-testid="onboarding-tour"]');
      if (await tourModal.isVisible()) {
        // Step 1: Calendar overview
        await expect(page.locator('[data-testid="tour-step-1"]')).toBeVisible();
        await expect(page.locator('[data-testid="tour-content"]')).toContainText(/welcome to your calendar/i);
        await page.click('[data-testid="tour-next-button"]');
        
        // Step 2: View switching
        await expect(page.locator('[data-testid="tour-step-2"]')).toBeVisible();
        await expect(page.locator('[data-testid="tour-content"]')).toContainText(/switch between views/i);
        await page.click('[data-testid="tour-next-button"]');
        
        // Step 3: Task creation
        await expect(page.locator('[data-testid="tour-step-3"]')).toBeVisible();
        await expect(page.locator('[data-testid="tour-content"]')).toContainText(/create tasks/i);
        await page.click('[data-testid="tour-next-button"]');
        
        // Step 4: Filters and search
        await expect(page.locator('[data-testid="tour-step-4"]')).toBeVisible();
        await expect(page.locator('[data-testid="tour-content"]')).toContainText(/filter and search/i);
        await page.click('[data-testid="tour-finish-button"]');
        
        // Verify tour completion
        await expect(tourModal).not.toBeVisible();
      }
      
      // Verify calendar is ready for use
      await expect(page.locator('[data-testid="calendar-container"]')).toBeVisible();
    });

    test('should allow user to create their first task', async ({ page }) => {
      // Click on today's date
      await page.click('[data-testid="today-date-cell"]');
      
      // Verify quick create modal opens
      await expect(page.locator('[data-testid="task-quick-create"]')).toBeVisible();
      
      // Fill in first task
      await page.fill('[data-testid="task-title-input"]', 'My First Calendar Task');
      await page.fill('[data-testid="task-description-input"]', 'This is my first task created in the calendar');
      await page.selectOption('[data-testid="task-priority-select"]', 'medium');
      
      // Add a tag
      await page.fill('[data-testid="task-tags-input"]', 'first-task');
      await page.press('[data-testid="task-tags-input"]', 'Enter');
      
      // Save task
      await page.click('[data-testid="save-task-button"]');
      
      // Verify task appears in calendar
      await expect(page.locator('[data-testid="task-card"]:has-text("My First Calendar Task")')).toBeVisible();
      
      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-message"]')).toContainText(/task created successfully/i);
    });
  });

  test.describe('Daily Task Management Journey', () => {
    test('should complete a typical daily workflow', async ({ page }) => {
      // Morning: Check today's tasks
      await page.click('[data-testid="today-button"]');
      await page.click('[data-testid="today-tasks-indicator"]');
      
      // Verify today's tasks panel opens
      await expect(page.locator('[data-testid="today-tasks-panel"]')).toBeVisible();
      
      // Create morning task
      await page.click('[data-testid="add-task-button"]');
      await page.fill('[data-testid="task-title-input"]', 'Morning standup meeting');
      await page.fill('[data-testid="task-time-input"]', '09:00');
      await page.selectOption('[data-testid="task-priority-select"]', 'high');
      await page.click('[data-testid="save-task-button"]');
      
      // Create afternoon task
      await page.click('[data-testid="add-task-button"]');
      await page.fill('[data-testid="task-title-input"]', 'Review project proposals');
      await page.fill('[data-testid="task-time-input"]', '14:00');
      await page.selectOption('[data-testid="task-priority-select"]', 'medium');
      await page.click('[data-testid="save-task-button"]');
      
      // Switch to day view to see hourly schedule
      await page.click('[data-testid="day-view-button"]');
      await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
      
      // Verify tasks appear in time slots
      await expect(page.locator('[data-testid="time-slot-09-00"] [data-testid="task-card"]')).toContainText('Morning standup meeting');
      await expect(page.locator('[data-testid="time-slot-14-00"] [data-testid="task-card"]')).toContainText('Review project proposals');
      
      // Complete morning task
      const morningTask = page.locator('[data-testid="task-card"]:has-text("Morning standup meeting")');
      await morningTask.hover();
      await page.click('[data-testid="complete-task-button"]');
      
      // Verify task is marked as completed
      await expect(morningTask.locator('[data-testid="task-status-completed"]')).toBeVisible();
      
      // Reschedule afternoon task by dragging
      const afternoonTask = page.locator('[data-testid="task-card"]:has-text("Review project proposals")');
      const newTimeSlot = page.locator('[data-testid="time-slot-15-00"]');
      await afternoonTask.dragTo(newTimeSlot);
      
      // Verify task moved to new time slot
      await expect(page.locator('[data-testid="time-slot-15-00"] [data-testid="task-card"]')).toContainText('Review project proposals');
      
      // End of day: Check completed tasks
      await page.click('[data-testid="agenda-view-button"]');
      await expect(page.locator('[data-testid="completed-tasks-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-tasks-section"]')).toContainText('Morning standup meeting');
    });

    test('should handle overdue tasks workflow', async ({ page }) => {
      // Create an overdue task (set due date to yesterday)
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Overdue Task');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await page.fill('[data-testid="task-due-date-input"]', yesterday.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-task-button"]');
      
      // Verify overdue notification appears
      await expect(page.locator('[data-testid="overdue-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="overdue-task-count"]')).toContainText('1');
      
      // Click on overdue notification
      await page.click('[data-testid="overdue-notification"]');
      
      // Verify overdue tasks panel opens
      await expect(page.locator('[data-testid="overdue-tasks-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="overdue-task-item"]')).toContainText('Overdue Task');
      
      // Reschedule overdue task
      await page.click('[data-testid="reschedule-task-button"]');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('[data-testid="new-due-date-input"]', tomorrow.toISOString().split('T')[0]);
      await page.click('[data-testid="confirm-reschedule-button"]');
      
      // Verify task is no longer overdue
      await expect(page.locator('[data-testid="overdue-task-count"]')).toContainText('0');
      
      // Verify task appears on new date
      await page.click('[data-testid="next-day-button"]');
      await expect(page.locator('[data-testid="task-card"]:has-text("Overdue Task")')).toBeVisible();
    });
  });

  test.describe('Weekly Planning Journey', () => {
    test('should complete weekly planning workflow', async ({ page }) => {
      // Switch to week view
      await page.click('[data-testid="week-view-button"]');
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
      
      // Navigate to next week for planning
      await page.click('[data-testid="next-week-button"]');
      
      // Plan Monday tasks
      const mondayCell = page.locator('[data-testid="day-column-monday"]');
      await mondayCell.click();
      
      await page.fill('[data-testid="task-title-input"]', 'Weekly team meeting');
      await page.fill('[data-testid="task-time-input"]', '10:00');
      await page.selectOption('[data-testid="task-priority-select"]', 'high');
      await page.fill('[data-testid="task-tags-input"]', 'meeting');
      await page.press('[data-testid="task-tags-input"]', 'Enter');
      await page.click('[data-testid="save-task-button"]');
      
      // Plan Wednesday tasks
      const wednesdayCell = page.locator('[data-testid="day-column-wednesday"]');
      await wednesdayCell.click();
      
      await page.fill('[data-testid="task-title-input"]', 'Project milestone review');
      await page.fill('[data-testid="task-time-input"]', '15:00');
      await page.selectOption('[data-testid="task-priority-select"]', 'high');
      await page.fill('[data-testid="task-tags-input"]', 'milestone');
      await page.press('[data-testid="task-tags-input"]', 'Enter');
      await page.click('[data-testid="save-task-button"]');
      
      // Plan Friday tasks
      const fridayCell = page.locator('[data-testid="day-column-friday"]');
      await fridayCell.click();
      
      await page.fill('[data-testid="task-title-input"]', 'Weekly report preparation');
      await page.fill('[data-testid="task-time-input"]', '16:00');
      await page.selectOption('[data-testid="task-priority-select"]', 'medium');
      await page.fill('[data-testid="task-tags-input"]', 'report');
      await page.press('[data-testid="task-tags-input"]', 'Enter');
      await page.click('[data-testid="save-task-button"]');
      
      // Verify all tasks appear in week view
      await expect(mondayCell.locator('[data-testid="task-card"]')).toContainText('Weekly team meeting');
      await expect(wednesdayCell.locator('[data-testid="task-card"]')).toContainText('Project milestone review');
      await expect(fridayCell.locator('[data-testid="task-card"]')).toContainText('Weekly report preparation');
      
      // Create recurring weekly meeting
      await mondayCell.click();
      await page.fill('[data-testid="task-title-input"]', 'Recurring standup');
      await page.fill('[data-testid="task-time-input"]', '09:00');
      await page.check('[data-testid="recurring-task-checkbox"]');
      await page.selectOption('[data-testid="recurrence-pattern-select"]', 'weekly');
      await page.click('[data-testid="save-task-button"]');
      
      // Verify recurring task appears
      await expect(mondayCell.locator('[data-testid="task-card"].recurring')).toContainText('Recurring standup');
      
      // Check workload balance
      await page.click('[data-testid="workload-indicator"]');
      await expect(page.locator('[data-testid="workload-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="monday-workload"]')).toContainText('2 tasks');
      await expect(page.locator('[data-testid="wednesday-workload"]')).toContainText('1 task');
      await expect(page.locator('[data-testid="friday-workload"]')).toContainText('1 task');
    });
  });

  test.describe('Project Management Journey', () => {
    test('should manage project tasks across calendar', async ({ page }) => {
      // Create project tasks with different priorities and deadlines
      const projectTasks = [
        { title: 'Project kickoff meeting', priority: 'high', days: 1, tags: 'project,kickoff' },
        { title: 'Requirements gathering', priority: 'high', days: 3, tags: 'project,requirements' },
        { title: 'Design mockups', priority: 'medium', days: 7, tags: 'project,design' },
        { title: 'Development phase 1', priority: 'high', days: 14, tags: 'project,development' },
        { title: 'Testing and QA', priority: 'medium', days: 21, tags: 'project,testing' },
        { title: 'Project delivery', priority: 'high', days: 28, tags: 'project,delivery' }
      ];
      
      // Create all project tasks
      for (const task of projectTasks) {
        await page.click('[data-testid="calendar-date-cell"]:first-child');
        await page.fill('[data-testid="task-title-input"]', task.title);
        await page.selectOption('[data-testid="task-priority-select"]', task.priority);
        
        // Set due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.days);
        await page.fill('[data-testid="task-due-date-input"]', dueDate.toISOString().split('T')[0]);
        
        // Add tags
        const tags = task.tags.split(',');
        for (const tag of tags) {
          await page.fill('[data-testid="task-tags-input"]', tag);
          await page.press('[data-testid="task-tags-input"]', 'Enter');
        }
        
        await page.click('[data-testid="save-task-button"]');
        await page.waitForTimeout(500);
      }
      
      // Filter by project tag
      await page.click('[data-testid="filters-button"]');
      await page.fill('[data-testid="tag-filter-input"]', 'project');
      await page.press('[data-testid="tag-filter-input"]', 'Enter');
      
      // Verify only project tasks are visible
      for (const task of projectTasks) {
        await expect(page.locator(`[data-testid="task-card"]:has-text("${task.title}")`)).toBeVisible();
      }
      
      // Switch to agenda view to see project timeline
      await page.click('[data-testid="agenda-view-button"]');
      await expect(page.locator('[data-testid="agenda-view"]')).toBeVisible();
      
      // Verify tasks are ordered by due date
      const taskElements = page.locator('[data-testid="task-item"]');
      await expect(taskElements.first()).toContainText('Project kickoff meeting');
      await expect(taskElements.last()).toContainText('Project delivery');
      
      // Mark first task as completed
      await page.click('[data-testid="task-item"]:has-text("Project kickoff meeting") [data-testid="complete-task-button"]');
      
      // Verify task is marked as completed
      await expect(page.locator('[data-testid="task-item"]:has-text("Project kickoff meeting")').locator('[data-testid="task-status-completed"]')).toBeVisible();
      
      // Update task status to in-progress
      await page.click('[data-testid="task-item"]:has-text("Requirements gathering")');
      await page.selectOption('[data-testid="task-status-select"]', 'in-progress');
      await page.click('[data-testid="save-task-button"]');
      
      // Verify status update
      await expect(page.locator('[data-testid="task-item"]:has-text("Requirements gathering")').locator('[data-testid="task-status-in-progress"]')).toBeVisible();
    });
  });

  test.describe('Calendar Customization Journey', () => {
    test('should customize calendar preferences and settings', async ({ page }) => {
      // Open calendar settings
      await page.click('[data-testid="calendar-settings-button"]');
      await expect(page.locator('[data-testid="preferences-panel"]')).toBeVisible();
      
      // Customize general settings
      await page.click('[data-testid="general-tab"]');
      await page.selectOption('[data-testid="default-view-select"]', 'week');
      await page.selectOption('[data-testid="start-of-week-select"]', '1'); // Monday
      await page.selectOption('[data-testid="time-format-select"]', '24h');
      
      // Customize display settings
      await page.click('[data-testid="display-tab"]');
      await page.check('[data-testid="compact-mode-checkbox"]');
      await page.check('[data-testid="show-week-numbers-checkbox"]');
      await page.uncheck('[data-testid="show-weekends-checkbox"]');
      
      // Customize notification settings
      await page.click('[data-testid="notifications-tab"]');
      await page.check('[data-testid="enable-notifications-checkbox"]');
      await page.check('[data-testid="notification-sound-checkbox"]');
      
      // Set quiet hours
      await page.check('[data-testid="quiet-hours-enabled-checkbox"]');
      await page.fill('[data-testid="quiet-hours-start-input"]', '22:00');
      await page.fill('[data-testid="quiet-hours-end-input"]', '08:00');
      
      // Save preferences
      await page.click('[data-testid="save-preferences-button"]');
      
      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      // Close preferences panel
      await page.click('[data-testid="close-preferences-button"]');
      
      // Verify preferences are applied
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible(); // Default view changed to week
      await expect(page.locator('[data-testid="calendar-container"].compact')).toBeVisible(); // Compact mode enabled
      await expect(page.locator('[data-testid="week-numbers"]')).toBeVisible(); // Week numbers shown
      await expect(page.locator('[data-testid="weekend-columns"]')).not.toBeVisible(); // Weekends hidden
      
      // Test preference persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify preferences persist after reload
      await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-container"].compact')).toBeVisible();
    });

    test('should export and import calendar data', async ({ page }) => {
      // Create some test data first
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Export Test Task');
      await page.click('[data-testid="save-task-button"]');
      
      // Open export/import panel
      await page.click('[data-testid="calendar-menu-button"]');
      await page.click('[data-testid="export-import-option"]');
      
      // Export calendar data
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-calendar-button"]')
      ]);
      
      // Verify export file
      expect(download.suggestedFilename()).toMatch(/calendar-export.*\.json/);
      
      // Save the downloaded file for import test
      const exportPath = await download.path();
      
      // Clear current data (simulate new user)
      await page.click('[data-testid="clear-calendar-data-button"]');
      await page.click('[data-testid="confirm-clear-button"]');
      
      // Verify data is cleared
      await expect(page.locator('[data-testid="task-card"]:has-text("Export Test Task")')).not.toBeVisible();
      
      // Import the exported data
      await page.setInputFiles('[data-testid="import-file-input"]', exportPath);
      await page.click('[data-testid="import-calendar-button"]');
      
      // Verify import success
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-card"]:has-text("Export Test Task")')).toBeVisible();
    });
  });

  test.describe('Mobile User Journey', () => {
    test('should complete mobile calendar workflow', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="calendar-container"].mobile')).toBeVisible();
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Switch to day view (better for mobile)
      await page.click('[data-testid="day-view-option"]');
      await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
      
      // Create task using touch interaction
      await page.touchscreen.tap(200, 400); // Tap on time slot
      
      await expect(page.locator('[data-testid="mobile-task-create"]')).toBeVisible();
      
      // Fill task details with mobile-optimized form
      await page.fill('[data-testid="task-title-input"]', 'Mobile Task');
      await page.tap('[data-testid="priority-high-button"]'); // Touch-friendly priority selection
      await page.tap('[data-testid="save-task-button"]');
      
      // Verify task appears
      await expect(page.locator('[data-testid="task-card"]:has-text("Mobile Task")')).toBeVisible();
      
      // Test swipe navigation
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(100, 300); // Swipe left
      
      // Verify navigation to next day
      await page.waitForTimeout(500);
      
      // Test long press for context menu
      const taskCard = page.locator('[data-testid="task-card"]:has-text("Mobile Task")');
      await taskCard.click({ delay: 1000 }); // Long press
      
      // Verify mobile context menu
      await expect(page.locator('[data-testid="mobile-context-menu"]')).toBeVisible();
      
      // Complete task from context menu
      await page.tap('[data-testid="complete-task-option"]');
      
      // Verify task completion
      await expect(taskCard.locator('[data-testid="task-status-completed"]')).toBeVisible();
    });
  });

  test.describe('Collaboration Journey', () => {
    test('should share calendar and collaborate on tasks', async ({ page }) => {
      // Create a task to share
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', 'Shared Project Task');
      await page.fill('[data-testid="task-assignee-input"]', 'colleague@example.com');
      await page.click('[data-testid="save-task-button"]');
      
      // Open sharing options
      await page.click('[data-testid="calendar-menu-button"]');
      await page.click('[data-testid="sharing-options"]');
      
      // Generate shareable link
      await page.click('[data-testid="generate-share-link-button"]');
      
      // Verify share link is generated
      await expect(page.locator('[data-testid="share-link-input"]')).toBeVisible();
      const shareLink = await page.locator('[data-testid="share-link-input"]').inputValue();
      expect(shareLink).toContain('http');
      
      // Copy share link
      await page.click('[data-testid="copy-share-link-button"]');
      await expect(page.locator('[data-testid="link-copied-notification"]')).toBeVisible();
      
      // Set sharing permissions
      await page.selectOption('[data-testid="share-permissions-select"]', 'view-edit');
      await page.click('[data-testid="update-permissions-button"]');
      
      // Invite collaborator
      await page.fill('[data-testid="invite-email-input"]', 'collaborator@example.com');
      await page.selectOption('[data-testid="collaborator-role-select"]', 'editor');
      await page.click('[data-testid="send-invitation-button"]');
      
      // Verify invitation sent
      await expect(page.locator('[data-testid="invitation-sent-notification"]')).toBeVisible();
      
      // Check collaboration features
      await page.click('[data-testid="task-card"]:has-text("Shared Project Task")');
      await expect(page.locator('[data-testid="task-collaborators"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-comments-section"]')).toBeVisible();
      
      // Add comment to task
      await page.fill('[data-testid="task-comment-input"]', 'This task needs review by Friday');
      await page.click('[data-testid="add-comment-button"]');
      
      // Verify comment appears
      await expect(page.locator('[data-testid="task-comment"]')).toContainText('This task needs review by Friday');
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    try {
      // Delete all test tasks
      const testTasks = page.locator('[data-testid="task-card"]').filter({
        hasText: /test|Test|journey|Journey|mobile|Mobile|shared|Shared/
      });
      
      const count = await testTasks.count();
      for (let i = 0; i < count; i++) {
        await testTasks.nth(i).click({ button: 'right' });
        await page.click('[data-testid="delete-task-option"]');
        await page.click('[data-testid="confirm-delete-button"]');
        await page.waitForTimeout(200);
      }
      
      // Reset preferences to defaults
      await page.click('[data-testid="calendar-settings-button"]');
      await page.click('[data-testid="reset-preferences-button"]');
      await page.click('[data-testid="confirm-reset-button"]');
      await page.click('[data-testid="close-preferences-button"]');
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });
});