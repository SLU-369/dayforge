@echo off
title Rotina 369
cd /d "%~dp0"
if not exist node_modules (
  echo Preparando o Rotina 369 pela primeira vez...
  call npm.cmd install
  if errorlevel 1 pause & exit /b 1
)
echo Abrindo o Rotina 369 em http://localhost:3000
start "Rotina 369" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"
call npm.cmd run dev -- --port 3000
pause
