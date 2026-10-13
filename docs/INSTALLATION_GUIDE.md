# CSC-HUB Installation Guide

This guide explains how to install and set up the CSC-HUB Desktop application.

## Prerequisites
- A Windows, macOS, or Linux machine.
- An active connection to the CSC-HUB network (for initial download).

## Downloading the Application
1. Ensure the CSC-HUB server is running on the master machine.
2. From the client machine, open a web browser and navigate to:
   `http://<SERVER_IP>:3000/downloads/`
3. Download the appropriate installer for your operating system:
   - **Windows**: `CSC-HUB-Setup-X.Y.Z.exe`
   - **macOS**: `CSC-HUB-X.Y.Z.dmg`
   - **Linux**: `CSC-HUB-X.Y.Z.AppImage`

## Installation
1. Run the downloaded installer.
2. Follow the on-screen instructions.
3. Upon first launch, enter your license key or upload your `csc_license_*.json` file.
4. Import the `csc_master_catalog_2026.json` file provided by your admin.

## Troubleshooting
If you cannot access the download page, ensure that the server machine's firewall allows incoming connections on port 3000.
