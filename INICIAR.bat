@echo off
title Dayforge
cd /d "%~dp0"
if not exist node_modules (
  echo Preparando o Dayforge pela primeira vez...
  call npm.cmd install
  if errorlevel 1 pause & exit /b 1
)
echo Abrindo o Dayforge em http://localhost:3000
start "Dayforge" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"
call npm.cmd run dev -- --port 3000
pause
