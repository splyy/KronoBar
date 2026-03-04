#!/bin/bash
set -e

APP_NAME="KronoBar"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the application..."
npm run make

echo "⏹  Stopping $APP_NAME if running..."
pkill -9 -f "$APP_NAME" 2>/dev/null || true
sleep 2

echo "📂 Installing to /Applications..."
rm -rf "/Applications/$APP_NAME.app"

ZIP_FILE=$(find out/make/zip -name "*.zip" | head -1)
if [ -z "$ZIP_FILE" ]; then
  echo "❌ Zip file not found"
  exit 1
fi

TMP_DIR=$(mktemp -d)
unzip -q "$ZIP_FILE" -d "$TMP_DIR"
mv "$TMP_DIR/$APP_NAME.app" /Applications/
rm -rf "$TMP_DIR"

xattr -cr "/Applications/$APP_NAME.app"

echo "🚀 Launching $APP_NAME..."
open "/Applications/$APP_NAME.app"

echo "✅ $APP_NAME installed successfully!"
