@echo off
title AirSetu APIx Frontend Server
echo ==============================================================================
echo  Starting AirSetu Real-Time Airfare Price Index (APIx) Frontend Server
echo  URL: http://localhost:5173
echo ==============================================================================
cd /d "%~dp0frontend\my-react-app"
npm run dev
pause
