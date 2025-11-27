@echo off
REM Heroku Deployment Script for Windows
REM This script will deploy the Error Analyzer API to Heroku

echo ========================================
echo Error Analyzer API - Heroku Deployment
echo ========================================
echo.

REM Check if Heroku CLI is installed
where heroku >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Heroku CLI is not installed!
    echo.
    echo Please install Heroku CLI:
    echo 1. Visit: https://devcenter.heroku.com/articles/heroku-cli
    echo 2. Download and install for Windows
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Heroku login status...
heroku auth:whoami
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Please login to Heroku:
    heroku login
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Heroku login failed
        pause
        exit /b 1
    )
)

echo.
echo [2/6] Initializing Git repository...
if not exist ".git" (
    git init
    echo Git repository initialized
) else (
    echo Git repository already exists
)

echo.
echo [3/6] Adding files to Git...
git add .
git commit -m "Initial deployment to Heroku" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Files committed successfully
) else (
    echo No new changes to commit
)

echo.
echo [4/6] Creating Heroku app...
set /p APP_NAME="Enter your Heroku app name (or press Enter for random name): "

if "%APP_NAME%"=="" (
    heroku create
) else (
    heroku create %APP_NAME%
)

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create Heroku app
    echo The app name might already be taken
    pause
    exit /b 1
)

echo.
echo [5/6] Setting environment variables...
echo.
echo Do you want to configure ServiceNow? (y/n)
set /p CONFIGURE_SNOW="> "

if /i "%CONFIGURE_SNOW%"=="y" (
    echo.
    set /p SNOW_INSTANCE="ServiceNow Instance URL (e.g., dev12345.service-now.com): "
    set /p SNOW_USERNAME="ServiceNow Username: "
    set /p SNOW_PASSWORD="ServiceNow Password: "

    heroku config:set SNOW_INSTANCE=%SNOW_INSTANCE%
    heroku config:set SNOW_USERNAME=%SNOW_USERNAME%
    heroku config:set SNOW_PASSWORD=%SNOW_PASSWORD%

    echo ServiceNow configuration set successfully
) else (
    echo Skipping ServiceNow configuration - will run in local mode
)

echo.
set /p SET_REPO="Set default GitHub repository? (y/n): "
if /i "%SET_REPO%"=="y" (
    set /p DEFAULT_REPO="Default Repository URL: "
    heroku config:set DEFAULT_REPO=%DEFAULT_REPO%
)

echo.
echo [6/6] Deploying to Heroku...
git push heroku master
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Successful!
echo ========================================
echo.

REM Get app info
for /f "tokens=*" %%i in ('heroku apps:info --json') do set APP_INFO=%%i

echo Your app is now live!
echo.
heroku open /api/health

echo.
echo To view logs: heroku logs --tail
echo To open app: heroku open
echo To set config: heroku config:set KEY=VALUE
echo.
echo View your app dashboard at:
echo https://dashboard.heroku.com/apps
echo.

pause
