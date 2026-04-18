@echo off
echo Starting Hospital Management System...
echo.

echo Starting Backend Server (Port 5000)...
start cmd /k "cd /d S:\Hospital\hospital-management-system && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 3000)...
start cmd /k "cd /d S:\Hospital\hospital-management-system\frontend && npx serve -p 3000"

echo.
echo Servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause