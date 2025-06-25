import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';

// In production, use a relative URL to avoid CORS issues
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

interface ConnectionStatus {
  health: boolean;
  database: boolean;
  auth: boolean;
  message: string;
}

const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    health: false,
    database: false,
    auth: false,
    message: 'Testing connection...',
  });
  const [loading, setLoading] = useState<boolean>(true);
  
  const testConnection = async () => {
    setLoading(true);
    setStatus(prev => ({ ...prev, message: 'Testing connection...' }));
    
    try {
      // Test basic API health
      const healthResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      setStatus(prev => ({ ...prev, health: true }));
      
      // Test database connection
      try {
        const dbResponse = await axios.get(`${API_URL}/db-status`, { timeout: 5000 });
        setStatus(prev => ({ 
          ...prev, 
          database: dbResponse.data.connected, 
          message: `Connected to backend. Database: ${dbResponse.data.dbName}` 
        }));
      } catch (dbError) {
        setStatus(prev => ({ 
          ...prev, 
          message: 'Connected to API but database connection failed' 
        }));
      }
      
      // Test auth endpoint
      try {
        await axios.post(`${API_URL}/auth/login`, { 
          email: 'test@test.com', 
          password: 'wrongpass' 
        }, { timeout: 5000 });
        setStatus(prev => ({ ...prev, auth: true }));
      } catch (authError: any) {
        // Even a 401 error means the endpoint is working
        if (authError.response) {
          setStatus(prev => ({ ...prev, auth: true }));
        } else {
          setStatus(prev => ({ 
            ...prev, 
            message: 'Auth endpoint not responding' 
          }));
        }
      }
    } catch (error: any) {
      setStatus({
        health: false,
        database: false,
        auth: false,
        message: `Connection failed: ${error.message}. Check that your backend is running.`
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    testConnection();
  }, []);
  
  const getStatusColor = () => {
    if (status.health && status.database && status.auth) return 'success';
    if (status.health) return 'warning';
    return 'error';
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Backend Connection Status
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Alert severity={getStatusColor()}>
          {status.message}
        </Alert>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Box>
          <Typography variant="subtitle2">API Health:</Typography>
          <Typography>{status.health ? '✅ Connected' : '❌ Failed'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2">Database:</Typography>
          <Typography>{status.database ? '✅ Connected' : '❌ Failed'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2">Auth Endpoint:</Typography>
          <Typography>{status.auth ? '✅ Responding' : '❌ Not working'}</Typography>
        </Box>
      </Box>
      
      <Button 
        variant="outlined" 
        onClick={testConnection}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Testing...' : 'Test Connection Again'}
      </Button>
    </Paper>
  );
};

export default ConnectionTest;
