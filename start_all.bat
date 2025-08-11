@echo off
setlocal enabledelayedexpansion

REM 清屏
cls

echo =======================================
echo         一键启动前后端服务脚本
echo =======================================

REM 检查后端虚拟环境
if not exist "backend\venv" (
    echo [INFO] 后端虚拟环境不存在，正在创建...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] 创建虚拟环境失败，请确保已安装Python
        pause
        exit /b 1
    )
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] 安装后端依赖失败
        pause
        exit /b 1
    )
    deactivate
    cd ..
    echo [INFO] 后端虚拟环境创建并配置完成
) else (
    echo [INFO] 后端虚拟环境已存在
)

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo [INFO] 前端依赖不存在，正在安装...
    cd frontend
    npm install
    if errorlevel 1 (
        echo [ERROR] 安装前端依赖失败，请确保已安装Node.js
        pause
        exit /b 1
    )
    cd ..
    echo [INFO] 前端依赖安装完成
) else (
    echo [INFO] 前端依赖已存在
)

REM 启动后端服务
start "Backend Server" cmd /k "cd backend && call venv\Scripts\activate.bat && python main.py"
if errorlevel 1 (
    echo [ERROR] 启动后端服务失败
    pause
    exit /b 1
)

REM 等待后端服务启动
echo [INFO] 等待后端服务启动...
timeout /t 5 /nobreak >nul

REM 启动前端服务
start "Frontend Server" cmd /k "cd frontend && npm start"
if errorlevel 1 (
    echo [ERROR] 启动前端服务失败
    pause
    exit /b 1
)

echo [INFO] 前后端服务已启动，请在 http://localhost:3000 访问前端页面
echo [INFO] 若需停止服务，请关闭所有打开的命令窗口

echo =======================================

pause
endlocal