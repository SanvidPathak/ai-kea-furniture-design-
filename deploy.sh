#!/bin/bash

# AI-KEA Deploy Script
# This script commits changes to git and deploys to Firebase Hosting

echo "🚀 AI-KEA Deploy Script"
echo "======================="
echo ""

# Check if commit message was provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a commit message"
  echo "Usage: ./deploy.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "📝 Step 1: Staging changes..."
git add .

echo ""
echo "💾 Step 2: Committing changes..."
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -ne 0 ]; then
  echo "❌ Git commit failed. Aborting deploy."
  exit 1
fi

echo ""
echo "📤 Step 3: Pushing to GitHub..."
git push

if [ $? -ne 0 ]; then
  echo "❌ Git push failed. Aborting deploy."
  exit 1
fi

echo ""
echo "🏗️  Step 4: Building production app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deploy."
  exit 1
fi

echo ""
echo "🔥 Step 5: Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
  echo "❌ Firebase deploy failed."
  exit 1
fi

echo ""
echo "✅ Deploy complete!"
echo "🌐 Live at: https://game-71a25.web.app"
