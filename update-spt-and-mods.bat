@echo off

echo Updating SPT and Mods

echo Installing dependencies...

@REM  Install 7zip
winget install --id mcmilk.7zip-zstd

@REM # Install git
winget install --id Git.Git

echo Update SPT

REM Get the download link for the latest version
set url="https://dev.sp-tarkov.com/SPT/Stable-releases/releases/latest/"
powershell -Command "$html=(New-Object Net.WebClient).DownloadString('%url%'); $match= $html | sls -Pattern 'href=\"(.*spt-releases\.modd\.in.*7z)\"'; echo $match.Matches.groups[1].value" > temp.txt
set /p download_link=<temp.txt

echo Downloading SPT version %version% from %download_link%
powershell -Command "(New-Object Net.WebClient).DownloadFile('%download_link%', 'spt.7z')"

@REM # Extract the downloaded file, overwriting existing files
"%PROGRAMFILES%\7-Zip-Zstandard\7z.exe" x spt.7z -aoa

echo SPT Updated, hopefully your Tarky version is compatible!

@REM Clean up
DEL "spt.zip"
DEL "temp.txt"

@REM @REM echo Updating Mods from git...
git clone git@github.com:RageLtd\spt-mods.git main

echo Done
pause
