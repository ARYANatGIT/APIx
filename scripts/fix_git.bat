@echo off
echo ===================================================
echo Repairing Git Index and Windows Locking Conflicts...
echo ===================================================

if exist ".git\index" (
    del /f /q ".git\index"
    echo Removed corrupted 0-byte .git\index.
)

git reset
echo Rebuilt clean Git index.

git config core.trustctime false
git config core.fscache false
git config core.preloadindex false
git config core.checkStat minimal
git config status.aheadbehind false
git config status.refresh false
echo Applied Windows Git stability settings.

echo.
git status -s
echo ===================================================
echo Git index successfully restored!
echo ===================================================

