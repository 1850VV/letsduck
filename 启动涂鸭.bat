@echo off
rem 涂鸭 DoodleDuck 个人版（Windows）：双击启动。只需要 Python 3.9+，不用安装其他东西。
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set "PY="
py -3 -c "import sys; sys.exit(sys.version_info < (3, 9))" >nul 2>nul && set "PY=py -3"
if not defined PY python -c "import sys; sys.exit(sys.version_info < (3, 9))" >nul 2>nul && set "PY=python"
if not defined PY goto nopython
%PY% run.py %*
if errorlevel 1 pause
exit /b

:nopython
echo 没有找到 Python 3.9 或更新版本。
where winget >nul 2>nul || goto download
choice /c YN /m "现在用 winget 安装 Python 3.12 吗"
if errorlevel 2 goto download
winget install -e --id Python.Python.3.12
echo.
echo 安装完成后，请关闭这个窗口，再重新双击「启动涂鸭.bat」。
pause
exit /b

:download
echo 请从 python.org 下载安装 Python，安装时勾选「Add python.exe to PATH」，然后重新双击本文件。
start "" https://www.python.org/downloads/windows/
pause
