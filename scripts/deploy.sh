#!/bin/bash

echo "🚀 Deploying Mobula SEO Agent to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Initialize Railway project (if not already initialized)
if [ ! -f "railway.toml" ]; then
    echo "📝 Initializing Railway project..."
    railway init
fi

# Set environment variables (will prompt user to set them)
echo "⚙️ Setting up environment variables..."
echo "Please set the following environment variables in Railway dashboard:"
echo "- CLAUDE_API_KEY"
echo "- NOTION_API_KEY" 
echo "- NOTION_DATABASE_ID"
echo "- SLACK_WEBHOOK_URL"
echo "- SERPAPI_KEY"
echo ""
echo "Opening Railway dashboard..."
railway open

read -p "Press Enter after you've set all environment variables..."

# Build and deploy
echo "🔨 Building application..."
npm run build

echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🔍 View logs: railway logs"
echo "📊 View dashboard: railway open"
echo "🤖 Your SEO agent is now running autonomously!"

# Show deployment status
railway status