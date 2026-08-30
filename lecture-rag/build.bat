@echo off
echo === Lecture RAG — Electron + Python Build ===
echo.

echo [1/3] Building Python backend (PyInstaller)...
python -m PyInstaller backend_build.spec --clean --noconfirm --distpath dist_backend
if errorlevel 1 (echo Backend build failed & pause & exit /b 1)
echo Backend built: dist_backend\backend\

echo.
echo [2/3] Installing Node dependencies...
npm install
if errorlevel 1 (echo npm install failed & pause & exit /b 1)

echo.
echo [3/3] Building Electron app...
npm run package
if errorlevel 1 (echo Electron build failed & pause & exit /b 1)

echo.
echo === Done! ===
echo Your app is at: release\win-unpacked\Lecture RAG.exe
echo.
pause
