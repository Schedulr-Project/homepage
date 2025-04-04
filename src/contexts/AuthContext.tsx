import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { isAuthenticated, login as authLogin, logout as authLogout, getCurrentUser } from '../services/auth';

// Import these constants from auth.ts to avoid undefined reference error
const AUTH_TOKEN_KEY = 'schedulr_auth_token'; 
const USER_DATA_KEY = 'schedulr_user_data';

interface User {
  _id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log('🔍 AuthContext: Checking for stored auth data');
        
        // Check if there's a stored token and user data
        if (isAuthenticated()) {
          const userData = getCurrentUser();
          if (userData && userData._id) {
            console.log('🔑 AuthContext: Valid token & user found:', userData.email);
            setUser(userData);
          } else {
            console.log('⚠️ AuthContext: Token found but user data invalid');
            // If user data is invalid, clear stored authentication
            authLogout();
          }
        } else {
          console.log('💡 AuthContext: No auth token found - user needs to login');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth state', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Login handler with improved debugging
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔒 AuthContext: Processing login for', email);
      
      // Store current localStorage state for debugging
      const beforeLocalStorage = {
        token: localStorage.getItem(AUTH_TOKEN_KEY),
        userData: localStorage.getItem(USER_DATA_KEY)
      };
      
      const response = await authLogin(email, password);
      console.log('🔔 AuthContext: Auth service response:', response);
      
      if (response.success && response.user) {
        console.log('✅ AuthContext: Login successful, updating state');
        setUser(response.user);
        
        // Check if localStorage was updated
        setTimeout(() => {
          const afterLocalStorage = {
            token: localStorage.getItem(AUTH_TOKEN_KEY),
            userData: localStorage.getItem(USER_DATA_KEY)
          };
          
          console.log('📝 LocalStorage before/after login:',
            beforeLocalStorage, afterLocalStorage);
        }, 100);
        
        return true;
      }
      
      console.error('❌ AuthContext: Login failed:', response.message);
      return false;
    } catch (error) {
      console.error('💥 AuthContext: Login error:', error);
      return false;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    console.log('AuthContext: Handling logout');
    try {
      await authLogout();
      setUser(null);
      console.log('AuthContext: User logged out successfully');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Still clear user state even if server-side logout fails
      setUser(null);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const authContextValue = {
    isLoggedIn: !!user,
    user,
    login: handleLogin,
    logout: handleLogout,
    loading
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
