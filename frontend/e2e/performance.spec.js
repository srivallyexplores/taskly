import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              metrics.fid = entry.processingStart - entry.startTime;
            }
          });
          
          // Calculate CLS
          let clsValue = 0;
          entries.forEach((entry) => {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.cls = clsValue;
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Assert Core Web Vitals thresholds
    if (performanceMetrics.fcp) {
      expect(performanceMetrics.fcp).toBeLessThan(1800); // Good FCP < 1.8s
    }
    
    if (performanceMetrics.lcp) {
      expect(performanceMetrics.lcp).toBeLessThan(2500); // Good LCP < 2.5s
    }
    
    if (performanceMetrics.fid) {
      expect(performanceMetrics.fid).toBeLessThan(100); // Good FID < 100ms
    }
    
    if (performanceMetrics.cls) {
      expect(performanceMetrics.cls).toBeLessThan(0.1); // Good CLS < 0.1
    }
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should handle large task lists efficiently', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.goto('/tasks');
    
    const startTime = Date.now();
    
    // Wait for task list to load
    await expect(page.getByTestId('task-list')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Task list should load within 2 seconds
    
    // Test scrolling performance
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    const scrollTime = Date.now() - scrollStartTime;
    expect(scrollTime).toBeLessThan(500); // Scrolling should be smooth
  });

  test('should maintain performance during interactions', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.goto('/tasks');
    
    // Measure interaction performance
    const startTime = Date.now();
    
    // Perform multiple interactions
    await page.getByRole('button', { name: /create task/i }).click();
    await page.getByLabel(/title/i).fill('Performance Test Task');
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Filter tasks
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('option', { name: /completed/i }).click();
    
    // Search tasks
    await page.getByPlaceholder(/search/i).fill('test');
    await page.getByPlaceholder(/search/i).clear();
    
    const interactionTime = Date.now() - startTime;
    expect(interactionTime).toBeLessThan(2000); // All interactions should complete within 2 seconds
  });

  test('should handle network conditions gracefully', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should still load within reasonable time even with network delay
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should handle slow network gracefully
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');
    
    // Check that images are lazy loaded
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      const src = await img.getAttribute('src');
      
      // Images should either be lazy loaded or be critical images
      if (src && !src.includes('data:')) {
        expect(loading === 'lazy' || await img.isInViewport()).toBeTruthy();
      }
    }
  });

  test('should minimize bundle size impact', async ({ page }) => {
    // Navigate to page and measure resource loading
    const resourceSizes = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          resourceSizes.push(parseInt(contentLength));
        }
      }
    });
    
    await page.goto('/');
    
    // Wait for all resources to load
    await page.waitForLoadState('networkidle');
    
    // Check that no single resource is excessively large
    const maxResourceSize = Math.max(...resourceSizes);
    expect(maxResourceSize).toBeLessThan(1024 * 1024); // No single resource should exceed 1MB
    
    // Check total bundle size
    const totalSize = resourceSizes.reduce((sum, size) => sum + size, 0);
    expect(totalSize).toBeLessThan(5 * 1024 * 1024); // Total should be under 5MB
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Navigate through different pages
    await page.goto('/tasks');
    await page.goto('/dashboard');
    await page.goto('/profile');
    await page.goto('/dashboard');
    
    // Check memory usage after navigation
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Memory shouldn't grow excessively (allow for 50% increase)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
      expect(memoryIncrease).toBeLessThan(0.5);
    }
  });
});