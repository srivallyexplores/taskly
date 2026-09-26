import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Starting global E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Setup test environment
    await setupTestEnvironment(page);
    
    // Create test user if needed
    await createTestUser(page);
    
    // Seed test data
    await seedTestData(page);
    
    console.log('✅ Global E2E test setup completed successfully');
  } catch (error) {
    console.error('❌ Global E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestEnvironment(page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  // Wait for application to be ready
  let retries = 0;
  const maxRetries = 30;
  
  while (retries < maxRetries) {
    try {
      await page.goto(baseURL, { timeout: 5000 });
      
      // Check if app is loaded
      await page.waitForSelector('body', { timeout: 5000 });
      
      // Check if API is responding
      const response = await page.request.get(`${baseURL}/api/health`);
      if (response.ok()) {
        console.log('✅ Application is ready');
        return;
      }
    } catch (error) {
      retries++;
      console.log(`⏳ Waiting for application to be ready... (${retries}/${maxRetries})`);
      await page.waitForTimeout(2000);
    }
  }
  
  throw new Error('Application failed to start within timeout period');
}

async function createTestUser(page) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  };
  
  try {
    // Check if test user already exists
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    if (loginResponse.ok()) {
      console.log('✅ Test user already exists');
      return;
    }
    
    // Create test user
    const registerResponse = await page.request.post(`${baseURL}/api/auth/register`, {
      data: testUser
    });
    
    if (registerResponse.ok()) {
      console.log('✅ Test user created successfully');
    } else {
      console.warn('  Failed to create test user, tests may fail');
    }
  } catch (error) {
    console.warn('  Error setting up test user:', error.message);
  }
}

async function seedTestData(page) {
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
      console.warn('  Could not login test user for seeding data');
      return;
    }
    
    const { token } = await loginResponse.json();
    
    // Clear existing test data
    await page.request.delete(`${baseURL}/api/tasks/test-data`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Create sample tasks for testing
    const sampleTasks = [
      {
        title: 'Sample High Priority Task',
        description: 'This is a sample high priority task for testing',
        priority: 'high',
        status: 'pending',
        due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        tags: ['sample', 'testing']
      },
      {
        title: 'Sample Medium Priority Task',
        description: 'This is a sample medium priority task for testing',
        priority: 'medium',
        status: 'in-progress',
        due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        tags: ['sample', 'testing']
      },
      {
        title: 'Sample Completed Task',
        description: 'This is a sample completed task for testing',
        priority: 'low',
        status: 'completed',
        due: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        completedAt: new Date().toISOString(),
        tags: ['sample', 'testing', 'completed']
      },
      {
        title: 'Sample Overdue Task',
        description: 'This is a sample overdue task for testing',
        priority: 'medium',
        status: 'pending',
        due: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Two days ago
        tags: ['sample', 'testing', 'overdue']
      }
    ];
    
    for (const task of sampleTasks) {
      await page.request.post(`${baseURL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: task
      });
    }
    
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.warn('  Error seeding test data:', error.message);
  }
}

export default globalSetup;