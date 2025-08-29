#!/bin/bash

# SEO Agent Auto-Start Script
# This script ensures the SEO agent is always running for daily Reddit scans

cd "/Users/ilya/SEO Agent/mobula-seo-agent"

# Check if service is already running
if pgrep -f "dist/main" > /dev/null; then
    echo "$(date): SEO agent already running"
    exit 0
fi

# Kill any stale processes
pkill -f "dist/main" 2>/dev/null || true

# Start the service
echo "$(date): Starting SEO agent..."
nohup npm run start:prod > seo-agent.log 2>&1 &

# Wait a moment and check if it started successfully
sleep 5
if pgrep -f "dist/main" > /dev/null; then
    echo "$(date): SEO agent started successfully"
else
    echo "$(date): Failed to start SEO agent"
    exit 1
fi