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
# Ask for the version to download
echo "Enter the version to download (e.g. 1.0.0):"
read version -r
echo "Version $version selected"

# Get the download link for the version
download_link=$(lynx -dump -listonly -nonumbers "https://dev.sp-tarkov.com/SPT/Stable-releases/releases/tag/$version" | grep "download/$version")

# Download the file
wget -O spt.zip "$download_link"

# Unzip the file, overwriting existing files
7z x spt.zip -aoa

echo "SPT Updated, hopefully your Tarky version is compatible!"

# clean up download
rm spt.zip

# Update Mods
git pull git@github.com:RageLtd/spt-mods.git main

echo "Done"
