# Schedulr

A comprehensive scheduling application for educational institutions that automates timetable generation, classroom allocation, and resource management.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- MongoDB (local installation or MongoDB Atlas account)

### Setting Up the Project

#### 1. Clone the repository
```bash
git clone <repository-url>
cd schedulr
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file with your MongoDB connection string
echo "MONGODB_URI=mongodb://localhost:27017/schedulr" > .env
echo "JWT_SECRET=your_secret_key_here" >> .env

# Initialize the database with test data
node scripts/createTestUser.js
node scripts/populateClassrooms.js

# Start the backend server
npm start
```

The backend server should now be running at http://localhost:5000.

#### 3. Frontend Setup
```bash
# From the project root
cd ..

# Install dependencies
npm install

# Start the frontend development server
npm start
```

The frontend should now be running at http://localhost:3000.

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Make sure both frontend and backend servers are running
2. Check that the backend server is correctly configured for CORS (in server.js)
3. Verify that API requests are going to the correct URL (http://localhost:5000/api)

### Database Connection Issues
If you have problems connecting to MongoDB:
1. Ensure MongoDB is running locally or your Atlas connection string is correct
2. Check the .env file has the correct MONGODB_URI

### Registration/Login Issues
1. If registration fails, check the server console for error messages
2. Try using the test account: 
   - Email: aryan@iitkgp.ac.in
   - Password: asdf

## Features

- Automated timetable generation for multiple departments
- Intelligent classroom and lab allocation
- Role-based authentication for admins and faculty
- Real-time availability of rooms
- Interactive timetable editing and visualization

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

## Testing the Backend Connection

If you're experiencing connection issues between the frontend and backend, you can run these tests:

### 1. Test the basic server health
```bash
curl http://localhost:5000/
```
You should see: `Schedulr API server is running!`

### 2. Test the API health endpoint
```bash
curl http://localhost:5000/api/health
```
You should see a JSON response with status information.

### 3. Test detailed system status
```bash
curl http://localhost:5000/api/health/status
```
You should see detailed information about database connectivity.

### 4. Test the registration endpoint manually
```bash
curl -X POST http://localhost:5000/api/health/register-test \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```
You should see a successful response confirming the test registration endpoint works.

### 5. Browser Test
You can also test API endpoints directly in your browser by visiting:
- http://localhost:5000/
- http://localhost:5000/api/health
- http://localhost:5000/api/test

If these tests pass but your frontend still can't connect, the issue is likely with CORS or how your frontend is making API calls.

## Network Connectivity Issues

If you're having trouble connecting to the backend server, try these steps:

### Step 1: Verify the server is running correctly
Make sure your terminal shows these messages when starting the backend:
```
Server running on port 5000
API available at http://localhost:5000/api
Test page available at http://localhost:5000/test
```

### Step 2: Try the standalone test server
```bash
cd backend
node test-server.js
```
This starts a minimal server without database connections or complex middleware.

### Step 3: Open the simple test HTML file
Open the `simple-test.html` file directly in your browser. This bypasses any React/frontend complexity.

### Step 4: Common fixes for network issues

1. **Port conflicts**: If another application is using port 5000, change it in `server.js`:
   ```javascript
   const PORT = process.env.PORT || 8080;
   ```

2. **Browser CORS issues**: Try a different browser or disable security temporarily:
   - Chrome: `--disable-web-security --user-data-dir="temp"`
   - Firefox: Use CORS Everywhere extension

3. **Firewall issues**: Check if your firewall is blocking connections to localhost:5000

4. **Network interface binding**: Make sure server.js uses `0.0.0.0` as the host:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {...});
   ```
   
5. **Proxy configuration**: Add a proxy to your frontend package.json:
   ```json
   "proxy": "http://localhost:5000"
   ```

## 🚀 Railway Deployment (All-in-One)

To deploy Schedulr (backend + frontend) on [Railway](https://railway.app):

### 1. Build the React Frontend
From the project root:
```bash
npm install           # Install frontend dependencies
npm run build         # Build React app (outputs to ./build)
```

### 2. Prepare Backend for Production
From the project root:
```bash
cd backend
npm install           # Install backend dependencies
```

### 3. Set Environment Variables
On Railway, set the following in the dashboard:
- `MONGODB_URI` (your MongoDB connection string)
- `JWT_SECRET` (your JWT secret)
- `NODE_ENV=production`
- `PORT=5000` (or leave default)

### 4. Deploy to Railway
- Push your code to GitHub.
- Create a new Railway project and link your repo.
- Railway will run `npm install` and `npm start` in `/backend` by default.
- The backend will serve the React build from `/build` for all non-API routes.

### 5. Access Your App
- The deployed URL will serve both the API and the React frontend from a single domain.

#### Notes
- Make sure the React build output (`/build`) is present at the project root before deploying.
- If you use Railway's "Deploy from GitHub" feature, add a `railway.json` file for custom build steps if needed.
- No need for a separate frontend deployment (Vercel/Netlify) unless you want to split frontend/backend.

---
