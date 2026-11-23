@echo off
title APREVO - Plataforma de Gestao de Estudos
echo ===================================================
echo Iniciando APREVO em http://localhost:5173/
echo ===================================================
start cmd /k "npx vite --port 5173 --host"
timeout /t 2 /nobreak >nul
start cmd /k "npx --yes cloudflared tunnel --url http://localhost:5173"
echo.
echo Servidor e tunel iniciados!
pause
