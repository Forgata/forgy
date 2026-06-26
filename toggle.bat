@echo off
:: Navigate to your project folder
cd /d "C:\Users\gombw\Desktop\projects\forgy"

if exist paused.lock (
    del paused.lock
    echo ----------------------------------------------------
    echo  PROXIMITY LOCK: RESUMED (Tracking your phone...)
    echo ----------------------------------------------------
    timeout /t 2 >nul
) else (
    echo. > paused.lock
    echo ----------------------------------------------------
    echo  PROXIMITY LOCK: PAUSED (Safe to step away!)
    echo ----------------------------------------------------
    timeout /t 2 >nul
)