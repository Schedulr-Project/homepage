import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would validate credentials here
    navigate('/dashboard');
  };

  const handleForgotPassword = (event: React.MouseEvent) => {
    event.preventDefault();
    console.log('Forgot password clicked');
  };

  const handleRegister = (event: React.MouseEvent) => {
    event.preventDefault();
    console.log('Register clicked');
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          <div className="input-box">
            <input type="text" placeholder="Username" required />
            <span className="icon">
              <PersonIcon fontSize="small" />
            </span>
          </div>
          <div className="input-box">
            <input type="password" placeholder="Password" required />
            <span className="icon">
              <LockIcon fontSize="small" />
            </span>
          </div>
          <div className="remember-forgot">
            <label><input type="checkbox" />Remember me</label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-button"
            >
              Forgot password?
            </button>
          </div>
          <button type="submit">Login</button>
          <div className="register-link">
            <p>Don't have an account? 
              <button 
                type="button" 
                onClick={handleRegister}
                className="text-button register-button"
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
