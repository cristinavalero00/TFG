@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Instala Node.js LTS desde https://nodejs.org y vuelve a abrir este archivo.
 pause
 exit /b 1
)
start "" "http://127.0.0.1:4173"
node iniciar.mjs
pause
