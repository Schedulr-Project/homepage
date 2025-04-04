const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulr';

console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@')}`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ SUCCESS: Connected to MongoDB');
  console.log(`Database: ${mongoose.connection.db.databaseName}`);
  console.log(`Host: ${mongoose.connection.host}`);
  
  // Check for User collection
  mongoose.connection.db.listCollections({name: 'users'}).next((err, collInfo) => {
    if (collInfo) {
      console.log('✅ User collection exists');
      
      // Check if user test account exists
      const User = mongoose.model('User', new mongoose.Schema({
        email: String,
        name: String
      }));
      
      User.findOne({email: 'aryan@iitkgp.ac.in'})
        .then(user => {
          if (user) {
            console.log('✅ Test user found:', user.email);
          } else {
            console.log('❌ Test user not found');
          }
          mongoose.connection.close();
        });
    } else {
      console.log('❌ User collection does not exist');
      mongoose.connection.close();
    }
  });
})
.catch(err => {
  console.error('❌ ERROR: Failed to connect to MongoDB');
  console.error(err);
  process.exit(1);
});
