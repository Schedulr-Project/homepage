# Schedulr

## Database Initialization

Before using the application, make sure to initialize the classroom data:

```bash
# Navigate to the backend directory
cd backend

# Run the classroom initialization script
node scripts/initClassrooms.js

# You can check if classrooms are properly initialized with:
node scripts/checkClassrooms.js
```

This will populate the database with classroom data required for the scheduling system.

# Schedulr Troubleshooting Guide

## Connection Issues Between Frontend and Backend

If your frontend can't connect to the backend, try the following steps:

1. **Check if the backend is running**
   ```
   cd backend
   npm start
   ```
   You should see "Server running on port 5000" and "Connected to MongoDB"

2. **Verify MongoDB Connection**
   ```
   cd backend
   node scripts/checkDbConnection.js
   ```
   This will check if your MongoDB connection is working properly

3. **Check if API endpoints are accessible**
   - Open a browser and navigate to http://localhost:5000/api/health
   - You should see a JSON response with "status": "success"

4. **Clear browser data**
   - Sometimes old tokens or cached data can cause issues
   - Clear your browser's local storage and cookies

5. **Check network requests in browser dev tools**
   - Open your browser's developer tools (F12)
   - Go to the Network tab
   - Look for failed requests (red items)
   - Check the error messages for more details

6. **Check CORS issues**
   - Look for errors mentioning "CORS" or "Cross-Origin"
   - Ensure your backend has proper CORS configuration

7. **Environment Variables**
   - Make sure REACT_APP_API_URL is set correctly in your frontend .env file
   - Make sure MONGODB_URI is set correctly in your backend .env file

## Common Fixes

1. **If MongoDB connection fails:**
   - Check if MongoDB is running
   - Verify the connection string in backend/.env
   - Try connecting with MongoDB Compass to test the connection

2. **If API endpoints return 401 errors:**
   - Your authentication token may be expired or invalid
   - Try logging out and logging back in

3. **If the backend won't start:**
   - Check if port 5000 is already in use
   - Try changing the PORT in backend/.env

4. **If login doesn't redirect:**
   - Check browser console for errors
   - Verify that authentication state is being properly updated
