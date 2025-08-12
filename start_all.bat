@echo off
setlocal enabledelayedexpansion

REM Clear screen and set title
title Gear Damage Identification
cls

echo ==============================================
echo      Gear Damage Identification
echo ==============================================

REM 检查Python和Node.js
python --version >nul 2>&1
if errorlevel 1 (
    echo [[31mERROR[0m] Python not detected. Please install Python first.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [[31mERROR[0m] Node.js not detected. Please install Node.js first.
    pause
    exit /b 1
)

REM 检查并创建后端虚拟环境
if not exist "backend\venv" (
    echo [INFO] Backend virtual environment not detected. Creating...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [[31mERROR[0m] Failed to create virtual environment.
        pause
        exit /b 1
    )
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [[31mERROR[0m] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    deactivate
    cd ..
    echo [[32mSUCCESS[0m] Backend environment configured successfully.
)

REM 检查并安装前端依赖
if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies not detected. Installing...
    cd frontend
    npm install
    if errorlevel 1 (
        echo [[31mERROR[0m] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    cd ..
    echo [[32mSUCCESS[0m] Frontend dependencies installed successfully.

)

echo [INFO] Starting services...


REM 启动后端服务
echo [INFO] Starting backend service...
cd backend
start "Backend" /min cmd /c "call venv\Scripts\activate.bat && python app.py"
cd ..

REM 启动前端服务
echo [INFO] Starting frontend service...
cd frontend
start "Frontend" /min cmd /c "npm start"
cd ..

REM 等待5秒，确保服务有足够时间启动
timeout /t 2 /nobreak >nul

echo [[32mSUCCESS[0m] All services have been started!
echo.
echo Local access address:    [32mhttp://localhost:3000[0m
echo Network access address:  [32mhttp://192.168.52.1:3000[0m
echo.
echo Press any key to stop all services...

pause >nul
taskkill /f /im python.exe 1>nul 2>nul
taskkill /f /im node.exe 1>nul 2>nul
echo All services stopped
endlocal