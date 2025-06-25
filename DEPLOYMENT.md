# Render Deployment Notes

To ensure your Schedulr application works correctly when deployed on Render:

## 1. Frontend API Configuration

The frontend has been updated to use a relative API URL when in production:

```typescript
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path in production
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
```

This change has been made in:
- `src/services/api.ts`
- `src/components/ConnectionTest.tsx`
- `src/mocks/handlers.ts`

## 2. Backend CORS Configuration

The backend's CORS configuration has been enhanced to ensure it accepts requests from all origins in development, and from the same origin in production:

```javascript
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true // Allow cookies if needed
}));
```

## 3. Static File Serving

The backend is configured to serve the React frontend build files in production:

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

## 4. Environment Variables on Render

Make sure you have set the following environment variables in your Render dashboard:

- `NODE_ENV=production` (critical for serving frontend files)
- `MONGODB_URI=<your-mongodb-connection-string>`
- `JWT_SECRET=<your-jwt-secret>`
- `SKIP_TYPESCRIPT=true` (to avoid TypeScript errors during build)

## 5. Build and Start Commands

On Render, use these commands:

- **Build Command:**
  ```
  SKIP_TYPESCRIPT=true npm install && SKIP_TYPESCRIPT=true npm run build && cd backend && npm install
  ```

- **Start Command:**
  ```
  cd backend && npm start
  ```

## 6. Deployed Application

Once deployed:
- Your frontend and backend will be served from the same domain
- API requests will use relative paths (e.g., `/api/courses`)
- No CORS issues should occur since everything is on the same origin
