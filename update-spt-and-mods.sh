#! /bin/bash
set -euo pipefail

echo "Updating SPT and Mods"

echo "Updating dependencies..."
# Figure out what package manager we're using and install 7zip and lynx if they aren't already installed
if [ -x "$(command -v apt-get)" ]; then
    sudo apt-get install -y p7zip-full lynx
elif [ -x "$(command -v dnf)" ]; then
    sudo dnf install -y p7zip lynx
elif [ -x "$(command -v pacman)" ]; then
    sudo pacman -S --needed --noconfirm p7zip lynx
elif [ -x "$(command -v zypper)" ]; then
    sudo zypper install -y p7zip lynx
else
    echo "Could not install 7zip and lynx. Please install them manually."
    exit 1
fi

echo "Updating SPT"

url="https://dev.sp-tarkov.com/SPT/Stable-releases/releases/latest/"

# Get the download link for the version
download_link=$(lynx -dump -listonly -nonumbers $url | grep ".*spt-releases\.modd\.in.*7z")

# Download the file
wget -O spt.7z "$download_link"

# Unzip the file, overwriting existing files
7z x spt.7z -aoa

echo "SPT Updated, hopefully your Tarky version is compatible!"

# clean up download
rm spt.7z

# Update Mods
git pull git@github.com:RageLtd/spt-mods.git main

echo "Done"
