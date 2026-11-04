@echo off
echo [PLAYNEX] Starting backend...
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0;%~dp0ml
python app.py

