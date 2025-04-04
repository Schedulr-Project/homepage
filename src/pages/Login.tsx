import React, { useState } from 'react';
import { 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import './Login.css';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/';

  // Handle "forgot password" click
  const handleForgotPassword = (event: React.MouseEvent) => {
    event.preventDefault();
    setError('Password reset functionality is not implemented yet.');
  };

  // Handle "register" click
  const handleRegister = (event: React.MouseEvent) => {
    event.preventDefault();
    setError('Registration functionality is not implemented yet. Use the test account.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const success = await login(email, password);
      
      if (success) {
        navigate(from);
      } else {
        // Simplified error message without test account reference
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          
          {isLoggedIn && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
              You are logged in! Redirecting...
            </Alert>
          )}
          
          <div className="input-box">
            <input 
              type="text" 
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isLoggedIn}
            />
            <span className="icon">
              <PersonIcon fontSize="small" />
            </span>
          </div>
          
          <div className="input-box">
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isLoggedIn}
            />
            <span className="icon">
              <LockIcon fontSize="small" />
            </span>
          </div>
          
          <div className="remember-forgot">
            <label>
              <input type="checkbox" disabled={loading || isLoggedIn} />
              Remember me
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-button"
              disabled={loading || isLoggedIn}
            >
              Forgot password?
            </button>
          </div>
          
          <button 
            type="submit"
            disabled={loading || isLoggedIn}
            style={{ position: 'relative' }}
          >
            {loading ? (
              <>
                <CircularProgress 
                  size={24} 
                  color="inherit" 
                  sx={{ 
                    position: 'absolute',
                    left: 'calc(50% - 12px)',
                    top: 'calc(50% - 12px)'
                  }} 
                />
                <span style={{ visibility: 'hidden' }}>Login</span>
              </>
            ) : 'Login'}
          </button>
          
          <div className="register-link">
            <p>
              Don't have an account? 
              <button 
                type="button" 
                onClick={handleRegister}
                className="text-button register-button"
                disabled={loading || isLoggedIn}
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
