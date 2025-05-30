# Deploying AI Assistant Server to Railway

This guide explains how to deploy the AI Assistant Server to [Railway](https://railway.app/).

## Prerequisites

1. A [Railway](https://railway.app/) account
2. Your project repository connected to GitHub
3. Railway CLI installed (optional, for local development)

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Railway account
2. Click on "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the branch you want to deploy (e.g., `main`)

### 2. Configure Environment Variables

In the Railway dashboard, navigate to your project and add the following environment variables:

#### Required Variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Railway will automatically provide this if you add a PostgreSQL database
- `REDIS_URL`: Railway will automatically provide this if you add a Redis database
- `FRONTEND_URL`: URL of your frontend application
- `CORS_ORIGIN`: Allowed CORS origins (can be the same as FRONTEND_URL)
- `APP_URL`: The URL of your deployed application

#### Optional Variables:
- `WEAVIATE_URL`: URL for your Weaviate vector database (if used)
- `MEDIA_STORAGE_PATH`: Path for storing media files
- Any other variables from `.env.example` that your application needs

### 3. Add Required Services

1. In your project dashboard, click "New"
2. Add the services your application needs:
   - PostgreSQL database
   - Redis database
   - Any other services

### 4. Deploy

Railway will automatically deploy your application when you push changes to the connected branch. You can also manually trigger deployments from the Railway dashboard.

## Monitoring and Logs

- View logs in the Railway dashboard under the "Deployments" tab
- Monitor resource usage in the "Metrics" tab

## Troubleshooting

If your deployment fails:

1. Check the build logs for errors
2. Verify that all required environment variables are set
3. Ensure your `railway.json` configuration is correct
4. Check that your application's port matches the PORT environment variable (default: 3000)

## Local Development with Railway

You can use the Railway CLI to develop locally with production services:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run your application locally with Railway services
railway run npm run start:dev
```
