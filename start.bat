@echo off
title iLovePDF Pro - Serveur & Application
color 0A
echo ========================================================
echo        Lancement de iLovePDF Pro Suite
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Demarrage du serveur Backend Python (FastAPI)...
start "iLovePDF Pro Backend" cmd /k "cd backend && python main.py"

echo [2/2] Demarrage de l'interface Frontend React (Vite)...
start "iLovePDF Pro Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
echo.
echo ========================================================
echo   Application disponible sur : http://localhost:5173
echo   Serveur API sur : http://localhost:8000
echo ========================================================
start http://localhost:5173
exit
