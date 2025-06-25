const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password } = req.body;
    
    // Check if required fields are provided
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name, email, password: password ? 'provided' : 'missing' });
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }
    
    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create a new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook in User model
      role: 'user' // Default role
    });
    
    await user.save();
    console.log('User registered successfully:', email);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Error in user registration:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: err.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    // If user doesn't exist
    if (!user) {
      console.log(`User with email ${email} not found`);
      return res.status(401).json({
        success: false,
        message: 'Email not registered'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Generate token
    const token = user.generateToken();
    
    console.log(`Login successful for ${email}`);
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during login'
    });
  }
});

// Get current user
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Logout - just implemented as a placeholder since JWT tokens are stateless
// In a real app, you might blacklist the token or use refresh tokens
router.post('/logout', authenticateUser, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Create test user if it doesn't exist
const createTestUser = async () => {
  try {
    const testEmail = 'aryan@iitkgp.ac.in';
    const testPassword = 'asdf';
    const testName = 'Aryan';
    
    const existingUser = await User.findOne({ email: testEmail });
    
    if (!existingUser) {
      const newUser = await User.create({
        name: testName,
        email: testEmail,
        password: testPassword,
        role: 'admin', // Give admin role to test user
      });
      console.log('Test user created:', newUser.email);
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Create test user on module load
createTestUser();

module.exports = router;
