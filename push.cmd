@echo off
REM ===========================================================================
REM push.cmd - APEX release: verify, commit, NON-FORCE push to ZenithValues/Apex-Ball-TD-WIKI.
REM
REM rev 8. Two hard lessons are baked in here:
REM   1. git answered "Everything up-to-date" while the site stayed old, with no
REM      explanation -> this script now proves the folder differs from origin/main
REM      BEFORE it commits, and stops loudly when it does not.
REM   2. a commit message containing a double quote ("What can I afford?") was
REM      passed as -m "%MSG%" and git read the rest of the sentence as file
REM      paths (error: pathspec 'can' did not match...) -> the message is now
REM      handed to git with -F <file>, which no shell quoting can break.
REM
REM Usage:  push.cmd             normal release
REM         push.cmd /retrigger  force an empty commit (re-run Actions on purpose)
REM         push.cmd /dryrun     show everything, push nothing
REM
REM Deploy the shared worker FIRST: see DEPLOY-WORKER.md.
REM ===========================================================================
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "package.json" (
  if exist "apex-td-project\package.json" cd /d "%~dp0apex-td-project"
)
if not exist "package.json" (
  echo ERROR: package.json not found. Extract the WHOLE zip before running.
  pause
  exit /b 1
)

set "APEX_REMOTE=https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git"
set "APEX_SITE=https://zenithvalues.github.io/Apex-Ball-TD-WIKI"
set "MODE=normal"
if /I "%~1"=="/retrigger" set "MODE=retrigger"
if /I "%~1"=="/dryrun" set "MODE=dryrun"

REM ---- what build is inside THIS folder? -----------------------------------
set "STAMP=unknown"
REM public\BUILD_ID.txt holds the bare build id on one line, which is why the
REM build script writes it: set /p cannot go wrong the way JSON parsing can.
if exist "public\BUILD_ID.txt" set /p "STAMP=" < "public\BUILD_ID.txt"
if "%STAMP%"=="unknown" if exist "public\build.json" for /f "tokens=2 delims=:" %%A in ('findstr /r /c:"id" "public\build.json"') do set "STAMP=%%A"
set STAMP=%STAMP: =%
set STAMP=%STAMP:"=%
set STAMP=%STAMP:,=%

REM ---- commit message: a FILE if the package ships one, else a safe default --
set "MSGFILE="
if exist "push-message.txt" set "MSGFILE=push-message.txt"
if not defined MSGFILE if exist "%~dp0push-message.txt" set "MSGFILE=%~dp0push-message.txt"
set "MSG=APEX release %STAMP%"
if defined MSGFILE set /p "MSG=" < "%MSGFILE%"
if not defined MSG set "MSG=APEX release %STAMP%"

echo.
echo   ================== APEX RELEASE ==================
echo   Repo        : ZenithValues/Apex-Ball-TD-WIKI
echo   Live site   : https://zenithvalues.github.io/Apex-Ball-TD-WIKI
echo   Folder      : %CD%
echo   Build here  : %STAMP%
echo   Mode        : %MODE%
echo   Commit msg  : %MSG%
echo   ==================================================
echo.
echo   Two different repos ship this project. If the URL you keep refreshing
echo   is not the "Live site" line above, NO push can ever change what you see.
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: git is not installed or not on PATH.
  pause
  exit /b 1
)

echo [1/5] Linking to GitHub...
if not exist ".git" (
  git init >nul 2>&1
  git symbolic-ref HEAD refs/heads/main >nul 2>&1
)
git config user.name >nul 2>&1 || git config user.name "APEX Release"
git config user.email >nul 2>&1 || git config user.email "release@users.noreply.github.com"
git remote get-url origin >nul 2>&1
if errorlevel 1 (git remote add origin %APEX_REMOTE%) else (git remote set-url origin %APEX_REMOTE%)

echo [2/5] Reading the remote history...
git fetch -q origin main
if errorlevel 1 goto :failfetch
git reset -q --soft FETCH_HEAD
if errorlevel 1 goto :failfetch

echo [3/5] Comparing this folder with origin/main...
git add -A
set "CHANGES=0"
for /f %%C in ('git status --porcelain ^| find /c /v ""') do set "CHANGES=%%C"

if "%CHANGES%"=="0" if not "%MODE%"=="retrigger" goto :nothing
if "%CHANGES%"=="0" goto :retrigger

echo       %CHANGES% file(s) differ from origin/main - OK to push.
echo       Remote HEAD:
git log -1 --format="        %%h %%ci  %%s" FETCH_HEAD

if "%MODE%"=="dryrun" (
  echo.
  echo DRY RUN - nothing was committed or pushed.
  pause
  exit /b 0
)

set "CONFIRM="
set /p "CONFIRM=Type YES to commit and push: "
if /I not "%CONFIRM%"=="YES" (
  echo Cancelled. Nothing was pushed.
  pause
  exit /b 0
)

echo [4/5] Committing...
if not defined MSGFILE goto :commit_plain
git commit -F "%MSGFILE%" >nul 2>&1
if errorlevel 1 goto :commitfailed
goto :commit_ok

:commit_plain
git commit -m "%MSG%" >nul 2>&1
if errorlevel 1 goto :commitfailed

:commit_ok
echo       Committed:
git log -1 --format="        %%h %%s"

echo [5/5] Pushing (no force)...
git push origin HEAD:main
if errorlevel 1 goto :fail

echo.
echo PUSHED.
echo   Source in this folder : %STAMP%
echo   GitHub Actions now runs lint + tests + build + Pages deploy (2-4 min).
echo   It stamps its OWN build id, so check the DATE and the route count rather
echo   than a matching hash:
echo     curl -s https://zenithvalues.github.io/Apex-Ball-TD-WIKI/build.json
echo   Still the old id after 5 minutes? Open the Actions tab - a FAILED
echo   workflow leaves the previous site online and changes nothing.
echo.
if exist "webhook.txt" if exist "notify.ps1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "notify.ps1" -Message "%MSG%" >nul 2>&1
)
pause
exit /b 0

:commitfailed
echo.
echo ERROR: git could not create the commit. Raw output:
if not defined MSGFILE goto :commitfailed_plain
git commit -F "%MSGFILE%"
pause
exit /b 1

:commitfailed_plain
git commit -m "%MSG%"
pause
exit /b 1

:nothing
echo.
echo ###########################################################################
echo #  NOTHING TO PUSH - and that is the whole bug you are fighting.          #
echo ###########################################################################
echo.
echo   This folder is byte-identical to origin/main, so git will answer
echo   "Everything up-to-date", GitHub will not build, and the live site will
echo   not change - no matter how many times you run this file.
echo.
echo   Most likely cause: this is an OLD extract. Unzip the NEWEST package into
echo   a NEW empty folder and run push.cmd there.
echo.
echo   Local build stamp : %STAMP%
echo   Remote HEAD       :
git log -1 --format="        %%h %%ci  %%s" FETCH_HEAD
echo.
echo   To re-run the deploy on purpose (empty commit):  push.cmd /retrigger
echo   To inspect without pushing:                      push.cmd /dryrun
echo.
pause
exit /b 2

:retrigger
echo       Forcing an empty commit to re-trigger GitHub Actions (mode: retrigger).
if "%MODE%"=="dryrun" (
  echo DRY RUN - nothing was committed or pushed.
  pause
  exit /b 0
)
if not defined MSGFILE goto :retrigger_plain
git commit --allow-empty -F "%MSGFILE%" >nul 2>&1
goto :retrigger_push

:retrigger_plain
git commit --allow-empty -m "%MSG%" >nul 2>&1

:retrigger_push
git push origin HEAD:main
if errorlevel 1 goto :fail
echo.
echo PUSHED an empty commit - Actions will rebuild the SAME source.
pause
exit /b 0

:failfetch
echo.
echo Could not reach GitHub. Check your internet and your git credentials,
echo then run push.cmd again. Nothing was changed.
pause
exit /b 1

:fail
echo.
echo Push FAILED. Read the git output above. Nothing was force-pushed and the
echo live site was NOT touched.
pause
exit /b 1
