@echo off
title AirSetu - MoSPI APIx Launcher
echo ==============================================================================
echo  AirSetu - MoSPI Real-time Airfare Price Index Platform
echo  Starting Backend and Frontend Services...
echo ==============================================================================
start "AirSetu Backend" run_backend.bat
start "AirSetu Frontend" run_frontend.bat
echo Both services launched in separate windows.
exit
