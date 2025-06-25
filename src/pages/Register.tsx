import React, { useState } from 'react';
import { 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import './Login.css'; // Reuse login styling

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting registration');
      
      // Using fetch API for registration
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}`, errorText);
        throw new Error(`Registration failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (data && data.success) {
        setSuccess('Registration successful! You will be redirected to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data?.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Error registering user:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Cannot connect to server. Please check if the backend server is running.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <h1>Register</h1>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
              {success}
            </Alert>
          )}
          
          <div className="input-box">
            <input 
              type="text" 
              placeholder="Full Name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <span className="icon">
              <PersonIcon fontSize="small" />
            </span>
          </div>
          
          <div className="input-box">
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <span className="icon">
              <EmailIcon fontSize="small" />
            </span>
          </div>
          
          <div className="input-box">
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <span className="icon">
              <LockIcon fontSize="small" />
            </span>
          </div>
          
          <div className="input-box">
            <input 
              type="password" 
              placeholder="Confirm Password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <span className="icon">
              <LockIcon fontSize="small" />
            </span>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
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
                <span style={{ visibility: 'hidden' }}>Register</span>
              </>
            ) : 'Register'}
          </button>
          
          <div className="register-link">
            <p>
              Already have an account? 
              <Link to="/login" className="text-button register-button">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
