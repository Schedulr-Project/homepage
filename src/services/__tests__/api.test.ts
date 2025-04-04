// Mock axios before importing the API module
jest.mock('axios', () => {
  // Create a complete axios mock with all required methods and properties
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    })),
    defaults: {
      headers: {
        common: {}
      }
    },
  };
});

// Mock auth service to avoid circular dependency
jest.mock('../auth', () => ({
  getToken: jest.fn(() => 'mocked-token')
}));

// Now import the api module after mocking its dependencies
import * as apiService from '../api';

describe('API Service', () => {
  test('exports the expected functions', () => {
    // Verify that the API module exports the expected functions
    expect(apiService.getCourses).toBeDefined();
    expect(apiService.createCourse).toBeDefined();
    expect(apiService.updateCourse).toBeDefined();
    // Add more assertions for other exported functions as needed
  });

  // Add more specific tests for API functions as needed
});
