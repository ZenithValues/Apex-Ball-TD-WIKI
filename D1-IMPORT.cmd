@echo off
setlocal EnableExtensions EnableDelayedExpansion
title APEX - import data into D1
cd /d "%~dp0"
set "SCRIPTDIR=%~dp0"

echo ============================================================
echo  APEX - load your wiki data into Cloudflare D1
echo  Folder: %SCRIPTDIR%
echo ============================================================
echo.

REM ================= 1. find the seed ========================
set "SEED="
if exist "%SCRIPTDIR%d1-seed.sql" set "SEED=%SCRIPTDIR%d1-seed.sql"

if not defined SEED if exist "%SCRIPTDIR%d1-seed.zip" (
  echo Found d1-seed.zip - extracting ...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%SCRIPTDIR%d1-seed.zip' -DestinationPath '%SCRIPTDIR%' -Force"
  if exist "%SCRIPTDIR%d1-seed.sql" set "SEED=%SCRIPTDIR%d1-seed.sql"
)

if not defined SEED for /f "delims=" %%F in ('dir /b /s "%SCRIPTDIR%d1-seed.sql" 2^>nul') do if not defined SEED set "SEED=%%F"
if not defined SEED for /f "delims=" %%F in ('dir /b /s "%USERPROFILE%\Downloads\d1-seed.sql" 2^>nul') do if not defined SEED set "SEED=%%F"
if not defined SEED for /f "delims=" %%F in ('dir /b /s "%USERPROFILE%\Desktop\d1-seed.sql" 2^>nul') do if not defined SEED set "SEED=%%F"
if not defined SEED for /f "delims=" %%F in ('dir /b /s "%SCRIPTDIR%..\d1-seed.sql" 2^>nul') do if not defined SEED set "SEED=%%F"

REM ================= 2. or build it from the live worker =====
if not defined SEED (
  echo d1-seed.sql was not found on this PC.
  echo Trying to build it straight from the live worker instead ...
  echo.
  if exist "%SCRIPTDIR%scripts\kv-to-d1.mjs" (
    node "%SCRIPTDIR%scripts\kv-to-d1.mjs" https://apex-db.apexballtd-admin.workers.dev/overrides --out "%SCRIPTDIR%d1-seed.sql"
    if exist "%SCRIPTDIR%d1-seed.sql" set "SEED=%SCRIPTDIR%d1-seed.sql"
  ) else (
    echo scripts\kv-to-d1.mjs is not in this folder either.
  )
)

if not defined SEED (
  echo.
  echo ------------------------------------------------------------
  echo  Could not get the data file.
  echo.
  echo  1. Download d1-seed.zip from the chat.
  echo  2. Save it into:  %SCRIPTDIR%
  echo  3. Run this file again.
  echo.
  echo  ^(The automatic build above needs the live database to be
  echo  reachable again - it comes back at 21:00 your time.^)
  echo ------------------------------------------------------------
  goto end
)

echo Seed: !SEED!
dir "!SEED!" | find /i "d1-seed.sql"
echo.

REM ================= 3. clean + copy to a short path ==========
if not exist "C:\apex" mkdir "C:\apex" >nul 2>nul
set "SHORT=C:\apex\seed.sql"
REM D1 refuses BEGIN TRANSACTION / COMMIT on import, so those two lines are
REM stripped here - that makes an older seed file work as well. The inline JS
REM avoids "!" on purpose: cmd's delayed expansion eats "!...!" spans.
node -e "const fs=require('fs');const re=/^\s*(BEGIN(\s+TRANSACTION)?|COMMIT)\s*;?\s*$/i;const out=fs.readFileSync(process.argv[1],'utf8').split(/\r?\n/).filter(function(l){return re.test(l)?false:true;}).join('\n');fs.writeFileSync(process.argv[2],out);console.log('cleaned seed, ' + out.length + ' bytes');" "!SEED!" "!SHORT!"
if errorlevel 1 (
  echo.
  echo ERROR: could not prepare the seed file.
  echo Download the NEW d1-seed.zip from the chat, replace the old one and run again.
  goto end
)
dir "!SHORT!" | find /i "seed.sql"
echo.

REM ================= 4. import ===============================
call npx wrangler d1 execute apex-db --remote --yes --file "!SHORT!"
if errorlevel 1 (
  echo.
  echo Retrying without --yes ...
  call npx wrangler d1 execute apex-db --remote --file "!SHORT!"
)
echo.

REM ================= 5. verify ===============================
echo ---------------- verification -----------------------------
call npx wrangler d1 execute apex-db --remote --command "SELECT section, count(*) FROM rows GROUP BY section"
echo.
echo Expected:  value 362   wiki 353   map 17   crate 2   material 1   item 1
echo.

echo ---------------- live worker ------------------------------
echo v=503 means the site is on live data.
echo v=0  means today's KV read limit is still in place (clears 21:00).
echo.
curl.exe -s https://apex-db.apexballtd-admin.workers.dev/status
echo.

:end
echo.
pause
endlocal
