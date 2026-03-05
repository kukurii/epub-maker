@echo off
chcp 65001 > nul
title EPUB Maker

echo 正在启动 EPUB Maker...
echo.

:: 检查 node_modules 是否存在，不存在则先安装依赖
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    npm install
    echo.
)

:: 启动开发服务器并自动打开浏览器
echo 启动开发服务器，请稍候...
start "" "http://localhost:3000"
npm run dev

pause
