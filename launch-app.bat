@echo off
setlocal enabledelayedexpansion
title QuranSwift - launch on emulator

set "PROJECT=%~dp0"
set "DEVICE=emulator-5554"

set "ADB=adb"
where adb >nul 2>nul || set "ADB=C:\Users\pc\Desktop\platform-tools\adb.exe"

cd /d "%PROJECT%"

echo [1/4] Checking emulator "%DEVICE%"...
"%ADB%" -s %DEVICE% get-state >nul 2>nul
if errorlevel 1 (
  echo    Emulator not found. Start it, then run this again.
  pause
  exit /b 1
)

echo [2/4] Starting Metro if needed...
netstat -ano | findstr ":8081" | findstr LISTENING >nul
if errorlevel 1 (
  echo    Starting Metro in a new window...
  start "QuranSwift Metro" cmd /k "cd /d ""%PROJECT%"" && npx expo start"
)

echo    Waiting for Metro on port 8081...
set /a tries=0
:waitmetro
netstat -ano | findstr ":8081" | findstr LISTENING >nul
if not errorlevel 1 goto metro_ready
set /a tries+=1
if !tries! geq 90 (
  echo    Metro did not start in time. Check the "QuranSwift Metro" window.
  pause
  exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto waitmetro
:metro_ready
echo    Metro is ready.

echo [3/4] Linking device port 8081...
"%ADB%" -s %DEVICE% reverse tcp:8081 tcp:8081 >nul

echo [4/4] Launching app...
"%ADB%" -s %DEVICE% shell am force-stop host.exp.exponent
"%ADB%" -s %DEVICE% shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent >nul

echo    Done. The app is opening in Expo Go on the emulator.
ping -n 3 127.0.0.1 >nul
endlocal
