# Render Deployment Instructions

## Setup in Render Dashboard

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Configure the following settings:

   - **Build Command:**
     ```
     SKIP_TYPESCRIPT=true npm install && SKIP_TYPESCRIPT=true npm run build && cd backend && npm install
     ```

   - **Start Command:**
     ```
     cd backend && npm start
     ```

   - **Environment Variables:**
     - `NODE_ENV=production` (critical for serving frontend files)
     - `MONGODB_URI=<your-mongodb-connection-string>`
     - `JWT_SECRET=<your-jwt-secret>`
     - `SKIP_TYPESCRIPT=true`

4. Click "Create Web Service"

5. **Important:** Make sure your backend/server.js file correctly serves the React build files in production mode with:
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     const buildPath = path.join(__dirname, '..', 'build');
     app.use(express.static(buildPath));
     app.get('*', (req, res, next) => {
       if (!req.path.startsWith('/api')) {
         res.sendFile(path.join(buildPath, 'index.html'));
       } else {
         next();
       }
     });
   }
   ```

## Troubleshooting

If you encounter build issues:
1. Make sure all test packages are in devDependencies
2. Check that no production code imports test files
3. Check the build logs for specific errors

## Local Testing of Production Build

To test the production build locally before deploying:
```bash
# Build the React frontend with TypeScript checks disabled
SKIP_TYPESCRIPT=true npm run build

# Start the backend in production mode
cd backend
NODE_ENV=production npm start
```

Then visit http://localhost:5000 to test both frontend and backend.
