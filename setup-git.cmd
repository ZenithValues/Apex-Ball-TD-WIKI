@echo off
setlocal
cd /d "%~dp0"

if exist ".git" (
  echo Git is already configured in this folder.
  exit /b 0
)

echo Configuring this folder as the permanent Git repository...
git init -b main || exit /b 1
git remote add origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git || exit /b 1
git fetch origin main || exit /b 1
git reset origin/main || exit /b 1
git branch --set-upstream-to=origin/main main || exit /b 1

echo.
echo Setup complete. From now on, use only:
echo   git add -A
echo   git commit -m "update"
echo   git push
endlocal
