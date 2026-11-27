@echo off
REM ===========================================================================
REM push.cmd - APEX verified release: verify, secret-scan, commit, NON-FORCE push.
REM Target: ZenithValues/Apex-Ball-TD-WIKI
REM
REM Security hardened:
REM   - Locks git origin strictly to the authorized APEX repository.
REM   - Automatically excludes .env / webhook.txt / key / credential files so
REM     they are never uploaded, and blocks any leaked secrets in staged diffs.
REM   - Uses delayed expansion and git commit -F to avoid batch metachar issues.
REM ===========================================================================
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not exist "package.json" (
  if exist "APEX Code\package.json" cd /d "%~dp0APEX Code"
)
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

set "STAMP=unknown"
if exist "public\BUILD_ID.txt" set /p "STAMP=" < "public\BUILD_ID.txt"
if "!STAMP!"=="unknown" if exist "public\build.json" for /f "tokens=2 delims=:" %%A in ('findstr /r /c:"id" "public\build.json"') do set "STAMP=%%A"
set "STAMP=!STAMP: =!"
set "STAMP=!STAMP:"=!"
set "STAMP=!STAMP:,=!"

set "MSGFILE="
if exist "push-message.txt" set "MSGFILE=push-message.txt"
if not defined MSGFILE if exist "%~dp0push-message.txt" set "MSGFILE=%~dp0push-message.txt"
set "MSG=APEX release !STAMP!"
if defined MSGFILE set /p "MSG=" < "!MSGFILE!"
if not defined MSG set "MSG=APEX release !STAMP!"

echo.
echo   ================== APEX RELEASE ==================
echo   Repo        : ZenithValues/Apex-Ball-TD-WIKI
echo   Live site   : https://zenithvalues.github.io/Apex-Ball-TD-WIKI
echo   Folder      : !CD!
echo   Build here  : !STAMP!
echo   Mode        : !MODE!
echo   Commit msg  : !MSG!
echo   ==================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: git is not installed or not on PATH.
  pause
  exit /b 1
)

echo [1/5] Linking to authorized GitHub repository...
if not exist ".git" (
  git init >nul 2>&1
  git symbolic-ref HEAD refs/heads/main >nul 2>&1
)
git config user.name >nul 2>&1 || git config user.name "APEX Release"
git config user.email >nul 2>&1 || git config user.email "release@users.noreply.github.com"
git remote get-url origin >nul 2>&1
if errorlevel 1 (git remote add origin !APEX_REMOTE!) else (git remote set-url origin !APEX_REMOTE!)

echo [2/5] Reading the remote history...
git fetch -q origin main
if errorlevel 1 goto :failfetch
git reset -q --soft FETCH_HEAD
if errorlevel 1 goto :failfetch

echo [3/5] Comparing this folder with origin/main and scanning for secrets...
git add -A

REM --- Unstage sensitive or .env files automatically so they are never uploaded ---
for /f "delims=" %%F in ('git diff --cached --name-only') do (
  echo(%%F| findstr /i /r "webhook\.txt \.env$ \.env\. \.pem$ \.key$ \.pfx$ credentials secret" >nul 2>&1
  if not errorlevel 1 (
    git cat-file -e "FETCH_HEAD:%%F" >nul 2>&1
    if not errorlevel 1 (
      git reset -q HEAD -- "%%F" >nul 2>&1
    ) else (
      git rm -q --cached -- "%%F" >nul 2>&1
    )
    echo       [excluded] Sensitive/env file will not be uploaded: %%F
  )
)

REM --- Security Guard 1: verify no sensitive filename remains staged ---
for /f "delims=" %%F in ('git diff --cached --name-only') do (
  echo(%%F| findstr /i /r "webhook\.txt \.env$ \.env\. \.pem$ \.key$ \.pfx$ credentials secret" >nul 2>&1
  if not errorlevel 1 (
    echo.
    echo SECURITY BLOCK: Sensitive file staged for commit: %%F
    git reset -q
    pause
    exit /b 3
  )
)

REM --- Security Guard 2: block leaked webhook URLs / tokens / private keys ---
git diff --cached -U0 -- . ":(exclude)push.cmd" ":(exclude)notify.ps1" ":(exclude)*.test.*" | findstr /i /r "^+.*discord\.com/api/webhooks/[0-9] ^+.*discordapp\.com/api/webhooks/[0-9] ^+.*ghp_[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9] ^+.*github_pat_[A-Za-z0-9] ^+.*BEGIN.*PRIVATE.KEY" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo SECURITY BLOCK: Potential secret, webhook URL, or token detected in staged diff:
  git diff --cached -U0 -- . ":(exclude)push.cmd" ":(exclude)notify.ps1" ":(exclude)*.test.*" | findstr /i /r "^+.*discord\.com/api/webhooks/[0-9] ^+.*discordapp\.com/api/webhooks/[0-9] ^+.*ghp_[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9] ^+.*github_pat_[A-Za-z0-9] ^+.*BEGIN.*PRIVATE.KEY"
  echo Aborting commit before anything leaves this machine.
  git reset -q
  pause
  exit /b 3
)

set "CHANGES=0"
for /f %%C in ('git diff --cached --name-only ^| find /c /v ""') do set "CHANGES=%%C"

if "!CHANGES!"=="0" if not "!MODE!"=="retrigger" goto :nothing
if "!CHANGES!"=="0" goto :retrigger

echo       !CHANGES! file(s) differ from origin/main - OK to push.
echo       Remote HEAD:
git log -1 --format="        %%h %%ci  %%s" FETCH_HEAD

if "!MODE!"=="dryrun" (
  echo.
  echo DRY RUN - nothing was committed or pushed.
  pause
  exit /b 0
)

set "CONFIRM="
set /p "CONFIRM=Type YES to commit and push: "
if /I not "!CONFIRM!"=="YES" (
  echo Cancelled. Nothing was pushed.
  pause
  exit /b 0
)

echo [4/5] Committing...
if not defined MSGFILE goto :commit_plain
git commit -F "!MSGFILE!" >nul 2>&1
if errorlevel 1 goto :commitfailed
goto :commit_ok

:commit_plain
git commit -m "!MSG!" >nul 2>&1
if errorlevel 1 goto :commitfailed

:commit_ok
echo       Committed:
git log -1 --format="        %%h %%s"

echo [5/5] Pushing (no force)...
git push origin HEAD:main
if errorlevel 1 goto :fail

echo.
echo PUSHED.
echo   Source in this folder : !STAMP!
echo   GitHub Actions now runs lint + tests + build + Pages deploy (2-4 min).
echo.
if exist "webhook.txt" if exist "notify.ps1" (
  findstr /c:"$BrandName     = \"Apex WIKI & Values\"" "notify.ps1" >nul 2>&1
  if not errorlevel 1 (
    set "APEX_NOTIFY_MESSAGE=!MSG!"
    powershell -NoProfile -ExecutionPolicy Bypass -File "notify.ps1"
    set "APEX_NOTIFY_MESSAGE="
  ) else (
    echo Notify skipped: notify.ps1 failed integrity check.
  )
)
pause
exit /b 0

:commitfailed
echo.
echo ERROR: git could not create the commit. Raw output:
if not defined MSGFILE goto :commitfailed_plain
git commit -F "!MSGFILE!"
pause
exit /b 1

:commitfailed_plain
git commit -m "!MSG!"
pause
exit /b 1

:nothing
echo.
echo NOTHING TO PUSH - folder matches origin/main.
echo   To re-run deploy:  push.cmd /retrigger
echo   To inspect:        push.cmd /dryrun
echo.
pause
exit /b 2

:retrigger
echo       Forcing an empty commit to re-trigger GitHub Actions (mode: retrigger).
if "!MODE!"=="dryrun" (
  echo DRY RUN - nothing was committed or pushed.
  pause
  exit /b 0
)
if not defined MSGFILE goto :retrigger_plain
git commit --allow-empty -F "!MSGFILE!" >nul 2>&1
goto :retrigger_push

:retrigger_plain
git commit --allow-empty -m "!MSG!" >nul 2>&1

:retrigger_push
git push origin HEAD:main
if errorlevel 1 goto :fail
echo.
echo PUSHED an empty commit - Actions will rebuild the SAME source.
pause
exit /b 0

:failfetch
echo.
echo Could not reach GitHub. Check your internet and your git credentials.
pause
exit /b 1

:fail
echo.
echo Push FAILED. Read the git output above. Nothing was force-pushed.
pause
exit /b 1
