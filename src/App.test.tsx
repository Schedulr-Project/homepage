import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock react-router-dom with all required hooks and components
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ path, element }: { path?: string; element: React.ReactNode }) => 
    path === '/' ? element : null,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/', search: '', state: null, hash: '' }),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  Outlet: () => null
}));

// Mock components
jest.mock('./components/Header', () => () => <div data-testid="mocked-header">Mocked Header</div>);
jest.mock('./components/Footer', () => () => <div data-testid="mocked-footer">Mocked Footer</div>);
jest.mock('./components/Login', () => () => <div data-testid="mocked-login">Mocked Login</div>);
jest.mock('./components/Dashboard', () => () => null);

describe('renders application with header and footer', () => {
  it('renders application layout', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByTestId('mocked-header')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-footer')).toBeInTheDocument();
  });

  it('On first load, should render login page', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mocked-login')).toBeInTheDocument();
    });
  });
});
