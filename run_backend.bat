@echo off
title AirSetu APIx Backend Server
echo ==============================================================================
echo  Starting AirSetu Real-Time Airfare Price Index (APIx) Backend Server
echo  Connected to MongoDB: apix_mospi
echo  Scheduler Interval: Every 30 Minutes
echo ==============================================================================
cd /d "%~dp0"
py -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
pause
