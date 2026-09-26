import { chromium } from '@playwright/test';

async function globalTeardown() {
  console.log('🧹 Starting global E2E test teardown...');
  
  // Launch browser for teardown
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clean up test data
    await cleanupTestData(page);
    
    // Clean up test user (optional - you might want to keep it for future runs)
    // await cleanupTestUser(page);
    
    console.log('✅ Global E2E test teardown completed successfully');
  } catch (error) {
    console.error('❌ Global E2E test teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    // Login as test user to get auth token
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.warn('  Could not login test user for cleanup');
      return;
    }
    
    const { token } = await loginResponse.json();
    
    // Delete all test tasks
    const tasksResponse = await page.request.get(`${baseURL}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (tasksResponse.ok()) {
      const tasks = await tasksResponse.json();
      
      // Delete tasks that contain test-related keywords
      const testKeywords = ['test', 'sample', 'e2e', 'Test', 'Sample', 'E2E'];
      const testTasks = tasks.filter(task => 
        testKeywords.some(keyword => 
          task.title.includes(keyword) || 
          task.description?.includes(keyword) ||
          task.tags?.some(tag => tag.includes(keyword.toLowerCase()))
        )
      );
      
      for (const task of testTasks) {
        await page.request.delete(`${baseURL}/api/tasks/${task._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      console.log(`✅ Cleaned up ${testTasks.length} test tasks`);
    }
    
    // Clean up any test preferences
    await page.request.delete(`${baseURL}/api/user/calendar-preferences`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('  Error during test data cleanup:', error.message);
  }
}

async function cleanupTestUser(page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    // Login as test user to get auth token
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.warn('  Could not login test user for deletion');
      return;
    }
    
    const { token } = await loginResponse.json();
    
    // Delete test user account
    await page.request.delete(`${baseURL}/api/user/account`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Test user account deleted');
  } catch (error) {
    console.warn('  Error deleting test user:', error.message);
  }
}

export default globalTeardown;