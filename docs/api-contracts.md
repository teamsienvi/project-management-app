# API Contracts

All routes require JWT auth unless noted. Request/response bodies are JSON.

## Workspaces

### POST /api/workspaces
Create a workspace.
```json
Request: { "name": "Marketing Ops" }
Response: { "workspace": { "id", "name", "slug", ... } }
```

### PATCH /api/workspaces/[workspaceId]
Rename a workspace. (owner/manager)
```json
Request: { "name": "Renamed" }
Response: { "workspace": { ... } }
```

### POST /api/workspaces/[workspaceId]/invite
Invite a member by email. (owner/manager)
```json
Request: { "email": "user@co.com", "role": "member" }
Response: { "invitation": { ... } }
```

### POST /api/workspaces/[workspaceId]/accept-invite
Accept an invitation by token.
```json
Request: { "token": "..." }
Response: { "workspace": { ... }, "membership": { ... } }
```

### GET /api/workspaces/[workspaceId]/members
List workspace members.
```json
Response: { "members": [{ "id", "user_id", "role", "profiles": { ... } }] }
```

### PATCH /api/workspaces/[workspaceId]/members/[memberId]
Change member role. (owner only)
```json
Request: { "role": "manager" }
Response: { "member": { ... } }
```

## Tasks

### POST /api/workspaces/[workspaceId]/tasks
Create a task.
```json
Request: { "title", "description?", "status?", "priority?", "dueDate?", "assigneeUserId?" }
Response: { "task": { ... } }
```

### PATCH /api/tasks/[taskId]
Update task fields.
```json
Request: { "status?", "priority?", "title?", "description?", "dueDate?", "assigneeUserId?" }
Response: { "task": { ... } }
```

### POST /api/tasks/[taskId]/complete
Mark task as done. Notifies creator, assignee, watchers.
```json
Request: {}
Response: { "task": { ... }, "notificationsCreated": 3 }
```

### POST /api/tasks/[taskId]/notes
Add a note to a task.
```json
Request: { "body": "First pass complete" }
Response: { "note": { ... } }
```

## Storyboards

### POST /api/workspaces/[workspaceId]/storyboards
Create a storyboard folder.
```json
Request: { "name", "description?", "parentFolderId?" }
Response: { "folder": { ... } }
```

## Files

### POST /api/files/upload
Upload a file (multipart/form-data).
```
Fields: file, workspaceId, targetFolderType, storyboardFolderId?, taskId?
Response: { "file": { "id", "googleDriveFileId", "webViewLink", "originalName" } }
```

### GET /api/files/[fileId]/open
Get file view URL (membership verified).
```json
Response: { "url": "https://drive.google.com/..." }
```

### DELETE /api/files/[fileId]
Soft-delete file.
```json
Response: { "ok": true }
```

## Notifications

### GET /api/notifications
List current user's notifications.
```json
Response: { "notifications": [...] }
```

### POST /api/notifications/[id]/read
Mark notification as read.
```json
Response: { "ok": true }
```
