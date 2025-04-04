import React, { useState } from 'react';
import {
  Box,
  Typography, 
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [showStorage, setShowStorage] = useState(false);
  const [storageData, setStorageData] = useState<{[key: string]: string}>({});
  
  const getLocalStorage = () => {
    const data: {[key: string]: string} = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    setStorageData(data);
    setShowStorage(true);
  };
  
  const clearStorage = () => {
    localStorage.clear();
    setStorageData({});
    window.location.reload();
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, mb: 2, bgcolor: '#f8f9fa' }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Debug Information
      </Typography>
      
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2">
          Auth Status: {isLoggedIn ? <Chip size="small" label="Logged In" color="success" /> : <Chip size="small" label="Not Logged In" color="error" />}
        </Typography>
      </Box>
      
      {user && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2">
            User: {user.email} ({user.name || 'No name'})
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Button size="small" variant="outlined" onClick={getLocalStorage}>
          Show localStorage
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={clearStorage}>
          Clear & Reload
        </Button>
      </Box>
      
      {showStorage && (
        <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto', fontSize: '0.75rem' }}>
          <Typography variant="caption" fontWeight="bold">LocalStorage Contents:</Typography>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(storageData, null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default DebugPanel;
