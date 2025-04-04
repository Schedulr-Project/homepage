import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the auth context to ensure a predictable state for testing
jest.mock('./contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      isLoggedIn: false,
      loading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Fix the Sidebar mock to respect auth context state
jest.mock('./components/Sidebar', () => {
  return {
    __esModule: true,
    // Import the mock version of useAuth to ensure consistent state
    default: () => {
      // Get the same mock useAuth that we defined above
      const { useAuth } = require('./contexts/AuthContext');
      const { isLoggedIn } = useAuth();
      
      // Only render the sidebar when logged in, matching the real component's behavior
      return isLoggedIn ? <div data-testid="sidebar-mock"></div> : null;
    },
  };
});

// Mock the pages
jest.mock('./pages/Login', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="login-page">Login Page Content</div>
  };
});

// Mock components
jest.mock('./components/Header', () => () => <header data-testid="header">Schedulr</header>);
jest.mock('./components/Footer', () => () => <footer data-testid="footer">Footer</footer>);
jest.mock('./components/Dashboard', () => () => <div data-testid="dashboard">Dashboard</div>);
jest.mock('./components/ProtectedRoute', () => ({ children }: { children: React.ReactNode }) => (
  <div data-testid="protected-route">{children}</div>
));

// Mock API service to prevent console warnings
jest.mock('./services/api', () => ({}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ path, element }: { path?: string; element: React.ReactNode }) => 
    path === '/login' ? <div data-testid="login-route">{element}</div> : null,
  Navigate: () => <div data-testid="navigate">Navigate</div>,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '', state: {}, hash: '' }),
}));

describe('renders application with header and footer', () => {
  test('On first load, should render login page', () => {
    render(<App />);
    
    // Check that the header is rendered
    const headerElement = screen.getByTestId('header');
    expect(headerElement).toBeInTheDocument();
    expect(headerElement.textContent).toContain('Schedulr');
    
    // Check that the footer is rendered
    const footerElement = screen.getByTestId('footer');
    expect(footerElement).toBeInTheDocument();
    
    // Check that the login page is rendered
    const loginElement = screen.getByTestId('login-page');
    expect(loginElement).toBeInTheDocument();
    
    // We should not see the sidebar when not logged in - already correctly tested
    const sidebarElement = screen.queryByTestId('sidebar-mock');
    expect(sidebarElement).not.toBeInTheDocument();
  });
});
