#!/bin/bash
set -e

APP_NAME="KronoBar"

echo "Installing dependencies..."
npm install

echo "Building the application..."
npm run make

echo "Stopping $APP_NAME if running..."
taskkill //F //IM "$APP_NAME.exe" 2>/dev/null || true
sleep 2

INSTALL_DIR="$LOCALAPPDATA/$APP_NAME"

echo "Installing to $INSTALL_DIR..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

ZIP_FILE=$(find out/make/zip -name "*.zip" | head -1)
if [ -z "$ZIP_FILE" ]; then
  echo "Zip file not found"
  exit 1
fi

unzip -q "$ZIP_FILE" -d "$INSTALL_DIR"

echo "Launching $APP_NAME..."
"$INSTALL_DIR/$APP_NAME.exe" &

echo "$APP_NAME installed successfully!"
