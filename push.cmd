@echo off
title APEX - Push Update

cd /d "%~dp0"

REM Enter the site folder (fresh extracts have no .git yet - it is created below)
if exist "%~dp0apex-td-project\.git" (
    cd /d "%~dp0apex-td-project"
) else if exist "%~dp0apex-td-project\package.json" (
    cd /d "%~dp0apex-td-project"
)

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Get it from https://git-scm.com
    pause
    exit /b 1
)

if exist ".git" goto repo_ready

echo Preparing the folder as a git repository...
git init -b main
if %errorlevel% neq 0 (
    git init
    git checkout -b main
)

:repo_ready
echo Connecting to GitHub...
git remote set-url origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git
if %errorlevel% neq 0 (
    git remote add origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git
)
git checkout main
if %errorlevel% neq 0 (
    git checkout -b main
)
git fetch origin main
git config push.autoSetupRemote true >nul 2>&1
git config branch.main.remote origin >nul 2>&1
git config branch.main.merge refs/heads/main >nul 2>&1
git branch --set-upstream-to=origin/main main >nul 2>&1

echo Uploading...
git add -A
git commit -m "Site update"
git push -u origin main --force
if %errorlevel% neq 0 (
    echo.
    echo Push failed. Check your GitHub access, then run this again.
    pause
    exit /b 1
)

echo.
echo Pushed. Sending the update notification...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0notify.ps1"

echo.
echo Done.
pause >nul
