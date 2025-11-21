@echo off
REM AI-KEA Deploy Script for Windows
REM This script commits changes to git and deploys to Firebase Hosting

echo.
echo 🚀 AI-KEA Deploy Script
echo =======================
echo.

REM Check if commit message was provided
if "%~1"=="" (
  echo ❌ Error: Please provide a commit message
  echo Usage: deploy.bat "Your commit message"
  exit /b 1
)

set COMMIT_MESSAGE=%~1

echo 📝 Step 1: Staging changes...
git add .

echo.
echo 💾 Step 2: Committing changes...
git commit -m "%COMMIT_MESSAGE%" -m "" -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

if errorlevel 1 (
  echo ❌ Git commit failed. Aborting deploy.
  exit /b 1
)

echo.
echo 📤 Step 3: Pushing to GitHub...
git push

if errorlevel 1 (
  echo ❌ Git push failed. Aborting deploy.
  exit /b 1
)

echo.
echo 🏗️  Step 4: Building production app...
call npm run build

if errorlevel 1 (
  echo ❌ Build failed. Aborting deploy.
  exit /b 1
)

echo.
echo 🔥 Step 5: Deploying to Firebase Hosting...
call firebase deploy --only hosting

if errorlevel 1 (
  echo ❌ Firebase deploy failed.
  exit /b 1
)

echo.
echo ✅ Deploy complete!
echo 🌐 Live at: https://game-71a25.web.app
