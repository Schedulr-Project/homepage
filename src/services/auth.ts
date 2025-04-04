import { loginUser, logoutUser, getCurrentUser as fetchCurrentUser } from './api';

interface User {
  _id: string;
  email: string;
  name?: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Key used for storing authentication data in localStorage
const AUTH_TOKEN_KEY = 'schedulr_auth_token';
const USER_DATA_KEY = 'schedulr_user_data';

/**
 * Authenticate user with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Auth service: Sending login request to server');
    
    // Direct API call approach for debugging
    const response = await loginUser({ email, password });
    console.log('Auth service: Server response:', response);
    
    if (response.success && response.user && response.token) {
      console.log('Auth service: Login successful, storing auth data');
      
      // Store authentication data
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      
      // Verify storage worked
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_DATA_KEY);
      
      if (!storedToken || !storedUser) {
        console.error('Auth service: Failed to store authentication data');
        return {
          success: false,
          message: 'Failed to save authentication data'
        };
      }
      
      return {
        success: true,
        user: response.user,
        token: response.token
      };
    } else {
      console.error('Auth service: Login failed', response.message || 'Unknown error');
      return {
        success: false,
        message: response.message || 'Login failed'
      };
    }
  } catch (error: any) {
    console.error('Auth service: Login error:', error);
    const message = error.response?.data?.message || 'Authentication failed';
    return {
      success: false,
      message
    };
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  console.log('Auth service: Logging out user');
  
  try {
    // Try to notify server about logout
    await logoutUser();
  } catch (error) {
    console.error('Auth service: Server logout error:', error);
  } finally {
    // Always clear local storage even if server request fails
    console.log('Auth service: Clearing local authentication data');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (e) {
    logout(); // Clear invalid data
    return null;
  }
};

/**
 * Get authentication token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Refresh current user data from the server
 */
export const refreshUserData = async (): Promise<User | null> => {
  try {
    if (!isAuthenticated()) return null;
    
    const response = await fetchCurrentUser();
    if (response.success && response.user) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      return response.user;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return null;
  }
};
