@echo off
rem 来做鸭 letsduck 源码启动器（Windows）。Node.js 24.20+（24.x）。
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node >nul 2>nul || goto nonode
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major!==24||minor<20)" >nul 2>nul
if errorlevel 1 goto nonode
if not exist node_modules goto install
call npm run start:local -- %*
set "DUCK_EXIT_CODE=%errorlevel%"
if not "%DUCK_EXIT_CODE%"=="0" pause
exit /b %DUCK_EXIT_CODE%

:install
echo 首次运行源码，请先在本目录执行 npm ci，再导入已授权的资产包。
pause
exit /b 2

:nonode
echo 本源码启动器需要 Node.js 24.20 或更新的 24.x 版本。
echo 请从 https://nodejs.org/en/download 安装，然后在本目录运行 npm ci。
pause
exit /b 2
