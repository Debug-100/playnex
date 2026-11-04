@echo off
echo [PLAYNEX] Running data pipeline and training...
cd /d "%~dp0"
set PYTHONPATH=%~dp0;%~dp0ml
echo Step 1: Preprocessing...
python ml/preprocessing.py
echo.
echo Step 2: Training model...
python ml/train.py
echo.
echo [DONE] Pipeline complete. Run start_backend.bat to start the API server.
pause

