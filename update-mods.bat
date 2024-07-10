@echo off

echo Updating Mods

echo Installing dependencies...

@REM Check if we have git installed already, if not install it
git --version >nul 2>&1
if errorlevel 1 (
    echo Git is not installed, installing...
    winget install --id Git.Git
)

echo Updating Mods from git...
git clone git@github.com:RageLtd\spt-mods.git main

echo Done
pause
