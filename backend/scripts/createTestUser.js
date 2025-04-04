const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulr';

console.log(`Connecting to MongoDB to create test user...`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Define User schema
  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
  });
  
  // Hash password before saving
  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  // Create User model
  const User = mongoose.model('User', UserSchema);
  
  // Test user credentials
  const testEmail = 'aryan@iitkgp.ac.in';
  const testPassword = 'asdf';
  const testName = 'Aryan';
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
    } else {
      // Create test user with admin role
      const newUser = new User({
        name: testName,
        email: testEmail,
        password: testPassword,  // Will be hashed by pre-save hook
        role: 'admin',
      });
      
      await newUser.save();
      console.log('✅ Test user created successfully:', newUser.email);
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});
