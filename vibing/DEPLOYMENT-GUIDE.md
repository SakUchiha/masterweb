# Deployment Guide for KidLearner

## Quick Fix for 404 Error

The 404 error occurs because the deployment platform can't find the main entry point. Here are the solutions:

### Option 1: Vercel Deployment (Recommended)

1. **Root index.html** - ✅ Created
   - Points to your main application
   - Provides a landing page with navigation

2. **vercel.json** - ✅ Created
   - Configures proper routing
   - Handles static file serving

3. **Deploy Steps:**
   ```bash
   git add .
   git commit -m "Add deployment configuration files"
   git push origin main
   ```

### Option 2: Netlify Deployment

1. **netlify.toml** - ✅ Created
   - Configures build settings
   - Sets up redirects

2. **Deploy Steps:**
   - Connect your GitHub repo to Netlify
   - Set build command: `echo 'Static site - no build needed'`
   - Set publish directory: `code-understanding-app/frontend`

### Option 3: GitHub Pages

1. **Create .github/workflows/deploy.yml:**
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./code-understanding-app/frontend
   ```

## Backend API Considerations

Since this is a static frontend deployment, you'll need to:

1. **Deploy backend separately** (Vercel Functions, Railway, Heroku, etc.)
2. **Update API URLs** in your frontend config
3. **Set up CORS** for cross-origin requests

## Testing the Fix

After deployment, your site should:
- ✅ Load the landing page at `/`
- ✅ Navigate to lessons at `/lessons`
- ✅ Access all frontend pages properly
- ✅ Serve static assets (CSS, JS, images)

## Troubleshooting

If you still get 404 errors:
1. Check the deployment platform's build logs
2. Verify the publish directory is set correctly
3. Ensure all files are committed and pushed
4. Check that the platform supports the file structure

## Next Steps

1. **Deploy backend API** separately
2. **Update frontend config** with new API URL
3. **Test all functionality** end-to-end
4. **Set up custom domain** (optional)
