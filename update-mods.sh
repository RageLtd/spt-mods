#! /bin/bash
set -euo pipefail

echo "Updating Mods"

echo "Updating dependencies..."
# Figure out what package manager we're using and install git, if it isn't already installed
if [ -x "$(command -v apt-get)" ]; then
    sudo apt-get install -y git
elif [ -x "$(command -v dnf)" ]; then
    sudo dnf install -y git
elif [ -x "$(command -v pacman)" ]; then
    sudo pacman -S --needed --noconfirm git
elif [ -x "$(command -v zypper)" ]; then
    sudo zypper install -y git
else
    echo "Could not install git. Please install it manually."
    exit 1
fi

echo "Updating mods..."
git pull git@github.com:RageLtd/spt-mods.git main

echo "Done"
read -rp "Press any key to continue" </dev/tty
exit 0
