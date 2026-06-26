@echo off
cd /d "C:\Users\gombw\Desktop\projects\forgy"

if exist app.pid (
    set /p ENGINE_PID=<app.pid
    
    :: Force kill the specific Node process (which kills its Python child automatically)
    taskkill /F /PID %ENGINE_PID% >nul 2>&1
    
    del app.pid >nul 2>&1
    if exist paused.lock del paused.lock >nul 2>&1
    
    echo ----------------------------------------------------
    echo  PROXIMITY LOCK: SHUT DOWN COMPLETELY
    echo ----------------------------------------------------
    timeout /t 2 >nul
) else (
    echo ----------------------------------------------------
    echo  Engine does not appear to be running.
    echo ----------------------------------------------------
    timeout /t 2 >nul
)