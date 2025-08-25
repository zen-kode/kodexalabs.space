#!/bin/bash

# Google Drive API Setup Script
# This script sets up the environment for Google Drive API access

echo "Setting up Google Drive API credentials..."

# Install the required package
npm install @google/genai

# Set the Google Cloud API key as an environment variable
export GOOGLE_CLOUD_API_KEY="AQ.Ab8RN6L0dGGgUFB_gP3uYdBXvvty-g2Q_emR7VWL3XrUSTVXpg"

echo "Google Drive API setup complete!"
echo "API Key has been set as: GOOGLE_CLOUD_API_KEY"
echo "You can now use the Google Drive API in your application."

# For Windows users, save this as setup-google-drive-api.bat instead:
# @echo off
# echo Setting up Google Drive API credentials...
# npm install @google/genai
# set GOOGLE_CLOUD_API_KEY=AQ.Ab8RN6L0dGGgUFB_gP3uYdBXvvty-g2Q_emR7VWL3XrUSTVXpg
# echo Google Drive API setup complete!
