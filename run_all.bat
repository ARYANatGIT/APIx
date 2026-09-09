@echo off
title MoSPI APIx Launcher
echo Starting Backend and Frontend...
start "MoSPI Backend" run_backend.bat
start "MoSPI Frontend" run_frontend.bat
echo Both services launched in separate windows.
exit
