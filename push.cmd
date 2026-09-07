@echo off
REM =============================================================================
REM push.cmd - ONE CLICK: commit + push to GitHub + Discord announce.
REM
REM The commit message is automatic (from push-message.txt shipped with every
REM update - no typing). Works in ANY folder, even a fresh unzip:
REM first run links the folder to the GitHub repo and adopts its history.
REM =============================================================================
setlocal
cd /d "%~dp0"

set "APEX_REMOTE=https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git"

set "MSG="
if exist "push-message.txt" set /p "MSG=" < "push-message.txt"
if not defined MSG set "MSG=Site update %DATE%"

echo.
echo [1/4] Committing: %MSG%
if exist "push-message.txt" del "push-message.txt" >nul 2>&1

REM --- link this folder to GitHub if needed -----------------------------------
set "FRESH=0"
if not exist ".git" set "FRESH=1"

if "%FRESH%"=="1" (
  echo       first run here - linking this folder to the GitHub repo...
  git init >nul 2>&1
  git checkout -b main >nul 2>&1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 git remote add origin %APEX_REMOTE%

if "%FRESH%"=="1" (
  git fetch -q origin main
  if errorlevel 1 goto :failfetch
  git reset -q --soft FETCH_HEAD
)

REM --- commit + push -----------------------------------------------------------
git add -A
git commit -m "%MSG%" >nul 2>&1
if errorlevel 1 echo       nothing new to commit - continuing

echo.
echo [2/4] Pushing to GitHub ^(main^)...
git push origin HEAD:main
if errorlevel 1 goto :fail

echo.
echo [3/4] Announcing on Discord...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0notify.ps1" -Message "%MSG%"
if errorlevel 1 echo       ^(announce failed - but the push went through^)

echo.
echo [4/4] Done - the site is updating.
pause
exit /b 0

:failfetch
echo.
echo Could not reach GitHub to link this folder.
echo Log in to git once ^(git pull in your repo^) then run push.cmd again.
pause
exit /b 1

:fail
echo.
echo Push FAILED - see the git output above.
pause
exit /b 1
