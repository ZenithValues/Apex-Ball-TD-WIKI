@echo off
title APEX Git Updater & Publisher
echo ===================================================
echo   APEX VALUES & WIKI - Quick Git Auto-Push
echo ===================================================
echo.

cd /d "%~dp0"

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git command line tool was not found in system PATH.
    echo Please download and install Git for Windows from https://git-scm.com
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking repository configuration...
if not exist ".git" (
    echo Initializing local repository on main branch...
    git init -b main >nul 2>&1 || (git init >nul 2>&1 & git checkout -b main >nul 2>&1)
)

git remote set-url origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git >nul 2>&1 || git remote add origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git >nul 2>&1
git checkout main >nul 2>&1 || git checkout -b main >nul 2>&1

echo [2/4] Syncing remote origin tracking...
git fetch origin main >nul 2>&1
git config push.autoSetupRemote true >nul 2>&1
git config pull.rebase true >nul 2>&1
git config branch.main.remote origin >nul 2>&1
git config branch.main.merge refs/heads/main >nul 2>&1
git branch --set-upstream-to=origin/main main >nul 2>&1

echo [3/4] Staging & committing all local file updates...
git rebase --abort >nul 2>&1
git merge --abort >nul 2>&1
git reset origin/main >nul 2>&1
git add -A >nul 2>&1
git commit -m "update" >nul 2>&1

echo [4/4] Pushing changes to GitHub main...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS: All updates pushed to GitHub!
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   PUSH ENCOUNTERED AN ERROR!
    echo ===================================================
    echo Troubleshooting:
    echo 1. Ensure you have push write access to ZenithValues/Apex-Ball-TD-WIKI
    echo 2. If GitHub prompts for password, use a Personal Access Token (PAT)
    echo 3. Run 'git push -u origin main' in command prompt to see details
    echo ===================================================
)

echo.
echo Press any key to close window...
pause >nul
