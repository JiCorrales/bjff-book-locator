@echo off
cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=4096
node start-dev.js
