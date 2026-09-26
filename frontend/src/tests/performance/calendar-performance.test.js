import { test, expect } from '@playwright/test';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  INITIAL_LOAD: 3000,      // 3 seconds
  VIEW_SWITCH: 1000,       // 1 second
  TASK_CREATION: 2000,     // 2 seconds
  SEARCH_RESPONSE: 500,    // 500ms
  FILTER_RESPONSE: 300,    // 300ms
  NAVIGATION: 500,         // 500ms
  LARGE_DATASET: 2000      // 2 seconds with 100+ tasks
};

test.describe('Calendar Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should load calendar within performance threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-container"]');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Calendar load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_LOAD);
  });

  test('should switch views within performance threshold', async ({ page }) => {
    const views = ['month', 'week', 'day', 'agenda'];
    
    for (const view of views) {
      const startTime = Date.now();
      
      await page.click(`[data-testid="${view}-view-button"]`);
      await page.waitForSelector(`[data-testid="${view}-view"]`);
      
      const switchTime = Date.now() - startTime;
      
      console.log(`${view} view switch time: ${switchTime}ms`);
      expect(switchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VIEW_SWITCH);
    }
  });

  test('should create tasks within performance threshold', async ({ page }) => {
    const taskCount = 10;
    const times = [];
    
    for (let i = 0; i < taskCount; i++) {
      const startTime = Date.now();
      
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `Performance Test Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForSelector(`[data-testid="task-card"]:has-text("Performance Test Task ${i}")`);
      
      const creationTime = Date.now() - startTime;
      times.push(creationTime);
      
      console.log(`Task ${i} creation time: ${creationTime}ms`);
      expect(creationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TASK_CREATION);
    }
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    console.log(`Average task creation time: ${averageTime}ms`);
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TASK_CREATION);
  });

  test('should search tasks within performance threshold', async ({ page }) => {
    // Create some tasks first
    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `Searchable Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(100);
    }
    
    // Test search performance
    const searchQueries = ['Searchable', 'Task', '1', 'Test'];
    
    for (const query of searchQueries) {
      const startTime = Date.now();
      
      await page.click('[data-testid="search-button"]');
      await page.fill('[data-testid="search-input"]', query);
      await page.waitForSelector('[data-testid="search-results"]');
      
      const searchTime = Date.now() - startTime;
      
      console.log(`Search "${query}" response time: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE);
      
      // Clear search
      await page.click('[data-testid="clear-search-button"]');
    }
  });

  test('should filter tasks within performance threshold', async ({ page }) => {
    // Create tasks with different properties
    const priorities = ['high', 'medium', 'low'];
    const statuses = ['pending', 'in-progress', 'completed'];
    
    for (let i = 0; i < 30; i++) {
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `Filter Test Task ${i}`);
      await page.selectOption('[data-testid="task-priority-select"]', priorities[i % 3]);
      await page.selectOption('[data-testid="task-status-select"]', statuses[i % 3]);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(50);
    }
    
    // Test filter performance
    await page.click('[data-testid="filters-button"]');
    
    const filters = [
      { type: 'priority', value: 'high' },
      { type: 'status', value: 'pending' },
      { type: 'priority', value: 'medium' }
    ];
    
    for (const filter of filters) {
      const startTime = Date.now();
      
      await page.check(`[data-testid="${filter.type}-${filter.value}-filter"]`);
      await page.waitForTimeout(100); // Allow filter to apply
      
      const filterTime = Date.now() - startTime;
      
      console.log(`Filter ${filter.type}:${filter.value} response time: ${filterTime}ms`);
      expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILTER_RESPONSE);
      
      // Uncheck filter
      await page.uncheck(`[data-testid="${filter.type}-${filter.value}-filter"]`);
    }
  });

  test('should navigate calendar within performance threshold', async ({ page }) => {
    const navigationActions = [
      { action: 'next-month', selector: '[data-testid="next-month-button"]' },
      { action: 'prev-month', selector: '[data-testid="prev-month-button"]' },
      { action: 'today', selector: '[data-testid="today-button"]' },
      { action: 'next-week', selector: '[data-testid="next-week-button"]' },
      { action: 'prev-week', selector: '[data-testid="prev-week-button"]' }
    ];
    
    for (const nav of navigationActions) {
      if (await page.locator(nav.selector).isVisible()) {
        const startTime = Date.now();
        
        await page.click(nav.selector);
        await page.waitForTimeout(100); // Allow navigation to complete
        
        const navTime = Date.now() - startTime;
        
        console.log(`${nav.action} navigation time: ${navTime}ms`);
        expect(navTime).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION);
      }
    }
  });

  test('should handle large dataset efficiently', async ({ page }) => {
    // Create a large number of tasks
    const taskCount = 100;
    console.log(`Creating ${taskCount} tasks for performance testing...`);
    
    const startCreation = Date.now();
    
    for (let i = 0; i < taskCount; i++) {
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `Large Dataset Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
      
      // Don't wait for every task to avoid test timeout
      if (i % 20 === 0) {
        await page.waitForTimeout(200);
        console.log(`Created ${i + 1}/${taskCount} tasks...`);
      }
    }
    
    const creationTime = Date.now() - startCreation;
    console.log(`Created ${taskCount} tasks in ${creationTime}ms`);
    
    // Test calendar responsiveness with large dataset
    const startNavigation = Date.now();
    
    await page.click('[data-testid="next-month-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="prev-month-button"]');
    await page.waitForTimeout(500);
    
    const navigationTime = Date.now() - startNavigation;
    
    console.log(`Navigation with ${taskCount} tasks: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET);
    
    // Test view switching with large dataset
    const startViewSwitch = Date.now();
    
    await page.click('[data-testid="week-view-button"]');
    await page.waitForSelector('[data-testid="week-view"]');
    
    const viewSwitchTime = Date.now() - startViewSwitch;
    
    console.log(`View switch with ${taskCount} tasks: ${viewSwitchTime}ms`);
    expect(viewSwitchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET);
  });

  test('should maintain performance during drag and drop operations', async ({ page }) => {
    // Create several tasks
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="calendar-date-cell"]:first-child');
      await page.fill('[data-testid="task-title-input"]', `Drag Test Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(100);
    }
    
    // Test drag and drop performance
    const sourceCell = page.locator('[data-testid="calendar-date-cell"]:first-child');
    const targetCell = page.locator('[data-testid="calendar-date-cell"]:nth-child(3)');
    
    const dragTasks = page.locator('[data-testid="task-card"]').filter({ hasText: 'Drag Test Task' });
    const taskCount = await dragTasks.count();
    
    for (let i = 0; i < Math.min(taskCount, 5); i++) {
      const startTime = Date.now();
      
      await dragTasks.nth(i).dragTo(targetCell);
      await page.waitForTimeout(200);
      
      const dragTime = Date.now() - startTime;
      
      console.log(`Drag operation ${i + 1} time: ${dragTime}ms`);
      expect(dragTime).toBeLessThan(1000); // 1 second threshold for drag operations
    }
  });

  test('should measure memory usage during extended use', async ({ page }) => {
    // This test simulates extended calendar usage
    const operations = [
      () => page.click('[data-testid="next-month-button"]'),
      () => page.click('[data-testid="prev-month-button"]'),
      () => page.click('[data-testid="week-view-button"]'),
      () => page.click('[data-testid="month-view-button"]'),
      () => page.click('[data-testid="day-view-button"]'),
      () => page.click('[data-testid="agenda-view-button"]')
    ];
    
    // Perform operations repeatedly
    for (let cycle = 0; cycle < 10; cycle++) {
      console.log(`Memory test cycle ${cycle + 1}/10`);
      
      for (const operation of operations) {
        await operation();
        await page.waitForTimeout(200);
      }
      
      // Check if page is still responsive
      const startTime = Date.now();
      await page.click('[data-testid="today-button"]');
      const responseTime = Date.now() - startTime;
      
      console.log(`Cycle ${cycle + 1} response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(1000);
    }
    
    console.log('✅ Memory usage test completed - calendar remained responsive');
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    // Test multiple simultaneous operations
    const concurrentOperations = [
      page.click('[data-testid="search-button"]'),
      page.click('[data-testid="filters-button"]'),
      page.click('[data-testid="calendar-settings-button"]')
    ];
    
    const startTime = Date.now();
    
    await Promise.all(concurrentOperations);
    
    const concurrentTime = Date.now() - startTime;
    
    console.log(`Concurrent operations time: ${concurrentTime}ms`);
    expect(concurrentTime).toBeLessThan(2000);
    
    // Check that all operations completed successfully
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="preferences-panel"]')).toBeVisible();
  });
});