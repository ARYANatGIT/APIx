@echo off
title MoSPI APIx Frontend Server
echo ==============================================================================
echo  Starting MoSPI Real-Time Airfare Price Index (APIx) Frontend Server
echo  URL: http://localhost:5173
echo ==============================================================================
cd /d "%~dp0frontend\my-react-app"
npm run dev
pause
