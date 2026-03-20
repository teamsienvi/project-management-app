import { z } from 'zod/v4';

/* ---- Workspace ---- */

export const createWorkspaceSchema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(100),
});

export const updateWorkspaceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
});

/* ---- Invitation ---- */

export const inviteMemberSchema = z.object({
    email: z.email('Valid email is required'),
    role: z.enum(['manager', 'member']),
});

export const acceptInviteSchema = z.object({
    token: z.string().min(1, 'Invitation token is required'),
});

/* ---- Task ---- */

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(500),
    description: z.string().max(5000).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    dueDate: z.iso.datetime().optional(),
    assigneeUserId: z.uuid().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.iso.datetime().nullable().optional(),
    assigneeUserId: z.uuid().nullable().optional(),
});

/* ---- Notes ---- */

export const createNoteSchema = z.object({
    body: z.string().min(1, 'Note body is required').max(10000),
});

/* ---- Storyboard ---- */

export const createStoryboardSchema = z.object({
    name: z.string().min(1, 'Folder name is required').max(200),
    description: z.string().max(2000).optional(),
    parentFolderId: z.uuid().nullable().optional(),
});

/* ---- File Upload ---- */

export const uploadFileSchema = z.object({
    workspaceId: z.uuid(),
    storyboardFolderId: z.uuid().optional(),
    taskId: z.uuid().optional(),
    targetFolderType: z.enum(['storyboard', 'general', 'task_attachment']),
});

/* ---- Member Role Change ---- */

export const updateMemberRoleSchema = z.object({
    role: z.enum(['manager', 'member']),
});

/* ---- Profile ---- */

export const updateProfileSchema = z.object({
    full_name: z.string().min(1).max(200).optional(),
    avatar_url: z.url().optional(),
});

/* ---- Helper types ---- */

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateStoryboardInput = z.infer<typeof createStoryboardSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
