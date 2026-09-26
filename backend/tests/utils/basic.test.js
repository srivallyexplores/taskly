describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key');
  });

  test('should have global test utilities', () => {
    expect(typeof global.createTestUser).toBe('function');
    expect(typeof global.createTestTeam).toBe('function');
    expect(typeof global.createTestProject).toBe('function');
    expect(typeof global.createTestTask).toBe('function');
  });

  test('should create test data correctly', () => {
    const user = global.createTestUser();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('password123');

    const task = global.createTestTask();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
  });
});