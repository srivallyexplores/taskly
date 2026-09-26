module.exports = {
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'controllers/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/env-setup.js'],
      transform: {
        '^.+\\.js$': 'babel-jest'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@aws-sdk)/)'
      ],
      testMatch: [
        '<rootDir>/tests/utils/secrets.test.js',
        '<rootDir>/tests/services/**/*.test.js',
        '<rootDir>/tests/unit/**/*.test.js'
      ]
    },
    {
      displayName: 'db',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/env-setup.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/tests/**/*.spec.js'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/tests/utils/secrets.test.js',
        '<rootDir>/tests/services/',
        '<rootDir>/tests/unit/'
      ]
    }
  ]
};
