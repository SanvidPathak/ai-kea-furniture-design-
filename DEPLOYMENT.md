# AI-KEA Deployment Guide

This guide covers deploying the AI-KEA furniture design platform to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Firebase Setup](#firebase-setup)
- [Build & Deploy](#build--deploy)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- Anthropic API key (for AI features)
- Domain name (optional)

## Environment Setup

### 1. Create Production Environment File

Create a `.env.production` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Anthropic API
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Application
VITE_APP_URL=https://your-domain.com
```

### 2. Update Meta Tags

Update the URLs in `index.html`:
- Replace `https://ai-kea.com/` with your actual domain
- Update Open Graph and Twitter image URLs

## Firebase Setup

### 1. Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

Select the following options:
- ✅ Firestore
- ✅ Hosting
- ✅ Storage

### 2. Configure Firestore Security Rules

Update `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Designs
    match /designs/{designId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Orders
    match /orders/{orderId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 3. Configure Storage Rules

Update `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /designs/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

### 4. Enable Authentication Methods

In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google Sign-in

### 5. Create Firestore Indexes

Create composite indexes for queries:
- Collection: `designs`, Fields: `userId` (Ascending), `createdAt` (Descending)
- Collection: `orders`, Fields: `userId` (Ascending), `createdAt` (Descending)
- Collection: `orders`, Fields: `userId` (Ascending), `status` (Ascending), `createdAt` (Descending)

## Build & Deploy

### 1. Build the Application

```bash
# Install dependencies
npm install

# Run production build
npm run build
```

This creates an optimized build in the `dist/` directory.

### 2. Test the Build Locally

```bash
# Preview the production build
npm run preview
```

Visit http://localhost:4173 to test.

### 3. Deploy to Firebase Hosting

```bash
# Deploy to Firebase
firebase deploy
```

Or deploy specific services:
```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy hosting and firestore rules
firebase deploy --only hosting,firestore
```

### 4. Alternative: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Environment variables can be added in Vercel dashboard.

### 5. Alternative: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Post-Deployment

### 1. Verify Deployment

- ✅ Visit your deployed URL
- ✅ Test user signup and login
- ✅ Create a design
- ✅ Place an order
- ✅ Test export features (PDF, CSV)
- ✅ Check mobile responsiveness
- ✅ Test 404 page (visit a non-existent route)

### 2. Configure Custom Domain (Firebase)

```bash
firebase hosting:channel:deploy production
```

In Firebase Console:
1. Go to Hosting
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### 3. Enable PWA Features

Ensure these files are accessible:
- `/manifest.json`
- `/icon-192.png`
- `/icon-512.png`
- `/favicon.svg`

### 4. Set Up Analytics

Add Google Analytics to `index.html` (before closing `</head>`):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 5. Create Sitemap

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://your-domain.com/signup</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Monitoring

### 1. Firebase Console

Monitor:
- Authentication users
- Firestore usage
- Storage usage
- Hosting traffic

### 2. Error Tracking (Optional)

Integrate Sentry:

```bash
npm install @sentry/react
```

Initialize in `main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 3. Performance Monitoring

Use Firebase Performance Monitoring:

```bash
npm install firebase
```

In `main.jsx`:
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check Firebase usage and costs
   - Review error logs
   - Monitor performance metrics

2. **Monthly**
   - Update dependencies (`npm update`)
   - Review and optimize Firestore indexes
   - Check security rules

3. **Quarterly**
   - Security audit
   - Performance optimization
   - User feedback review

### Backup Strategy

1. **Firestore Backups**
   ```bash
   gcloud firestore export gs://[BUCKET_NAME]
   ```

2. **Code Backups**
   - Use Git for version control
   - Tag releases: `git tag -a v1.0.0 -m "Release v1.0.0"`
   - Push to remote: `git push origin --tags`

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Firebase Deploy Fails

```bash
# Re-login to Firebase
firebase logout
firebase login

# Try deploying again
firebase deploy
```

### Environment Variables Not Working

- Ensure `.env.production` exists
- Variables must start with `VITE_`
- Rebuild after changing environment variables

## Support

For issues:
1. Check Firebase Console for errors
2. Review browser console for client errors
3. Check network tab for API failures
4. Review Firestore rules for permission issues

## Security Checklist

Before going live:
- ✅ Enable HTTPS (automatic with Firebase/Vercel/Netlify)
- ✅ Configure CSP headers
- ✅ Review Firestore security rules
- ✅ Review Storage security rules
- ✅ Enable Firebase App Check (optional)
- ✅ Set up rate limiting for API calls
- ✅ Rotate API keys regularly
- ✅ Enable 2FA on Firebase account

## Performance Checklist

- ✅ Code splitting implemented (React.lazy)
- ✅ Images optimized
- ✅ Gzip compression enabled
- ✅ CDN configured (automatic with Firebase Hosting)
- ✅ Lighthouse score > 90

---

**Deployment Complete! 🚀**

Your AI-KEA application is now live and ready to help users design their perfect furniture!
