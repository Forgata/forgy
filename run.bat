@echo off
:: Give Windows 15 seconds to initialize Bluetooth drivers on startup
timeout /t 15 /nobreak >nul

:: Navigate to your exact project folder
cd /d "C:\Users\gombw\Desktop\projects\forgy"

:: Execute the engine
node dist/main.js