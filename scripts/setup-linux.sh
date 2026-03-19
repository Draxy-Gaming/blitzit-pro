#!/bin/bash
echo "Installing Electron system dependencies for Linux/Codespaces..."
sudo apt-get update -qq && sudo apt-get install -y \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 libxss1 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2 \
  libnss3 libxtst6 xvfb
echo "Done. Now run: DISPLAY=:99 npm run dev"
