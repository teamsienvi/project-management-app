# Google Drive Integration

## Overview
The app uses a dedicated Google account's Drive as the file storage backend. All files and folders are created under one root folder configured via `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

## Setup Steps

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Google Drive API**

### 2. Create OAuth2 Credentials
1. Go to APIs & Services → Credentials
2. Create OAuth client ID (type: **Desktop app** or **Web application**)
3. Note the **Client ID** and **Client Secret**

### 3. Obtain a Refresh Token
Use the OAuth2 playground or a script:
```bash
# Using Google's OAuth2 Playground:
# 1. Go to https://developers.google.com/oauthplayground
# 2. Configure with your client ID/secret
# 3. Authorize the https://www.googleapis.com/auth/drive scope
# 4. Exchange for tokens and copy the refresh token
```

### 4. Create the Root Folder
1. Sign into Google Drive with the dedicated account
2. Create a folder (e.g., "IWPM App Storage")
3. Copy the folder ID from the URL

### 5. Set Environment Variables
```
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_ROOT_FOLDER_ID=...
GOOGLE_DRIVE_OWNER_EMAIL=drive-account@gmail.com
```

## Folder Structure
When a workspace is created, the app provisions:
```
/IWPM App Storage (root)
  /Workspace - Marketing Ops
    /Storyboards
    /General Files
    /Task Attachments
```

## Security
- Google Drive credentials are **server-only** (never exposed to client)
- The app enforces permissions — Drive is just storage
- Files can only be accessed through the app's API routes
- Unrelated Drive content outside the root folder is never accessed
