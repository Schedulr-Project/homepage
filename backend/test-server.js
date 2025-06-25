/**
 * Simple standalone test server to verify network connectivity
 * Run with: node test-server.js
 */

const express = require('express');
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Test server is working!');
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test registration endpoint
app.post('/api/register-test', express.json(), (req, res) => {
  console.log('Received registration test request:', req.body);
  res.json({
    success: true,
    message: 'Registration test successful',
    receivedData: req.body
  });
});

// Start server on port 5000, binding to all interfaces
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', '✓ Test server started successfully!');
  console.log(`Server running at:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://localhost:${PORT}/api/test`);
  console.log('\nTry accessing these URLs in your browser');
  console.log('Press Ctrl+C to stop the server');
});