@echo off
echo ========================================
echo  World Studio Records - Auto Updater
echo ========================================
echo.

:menu
echo [1] Download new music NOW
echo [2] Setup automatic daily updates
echo [3] Exit
echo.
set /p choice="Choose option (1-3): "

if "%choice%"=="1" goto download
if "%choice%"=="2" goto schedule
if "%choice%"=="3" goto end

:download
echo.
echo Starting download...
node download_music.js
echo.
echo Press any key to return to menu...
pause >nul
cls
goto menu

:schedule
echo.
echo Setting up daily automatic updates at 3:00 AM...
schtasks /create /tn "WSR Music Updater" /tr "%cd%\download_music.js" /sc daily /st 03:00 /f
echo.
echo ✅ Automatic updates configured!
echo    Music will be downloaded daily at 3:00 AM
echo.
echo Press any key to return to menu...
pause >nul
cls
goto menu

:end
echo.
echo Goodbye!
timeout /t 2 >nul
