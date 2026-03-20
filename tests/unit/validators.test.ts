import { createWorkspaceSchema, createTaskSchema, inviteMemberSchema, createNoteSchema, updateTaskSchema, createStoryboardSchema, uploadFileSchema, updateMemberRoleSchema } from '@/lib/validators';

describe('Validators', () => {
    describe('createWorkspaceSchema', () => {
        it('accepts valid workspace name', () => {
            const result = createWorkspaceSchema.safeParse({ name: 'Marketing Ops' });
            expect(result.success).toBe(true);
        });

        it('rejects empty name', () => {
            const result = createWorkspaceSchema.safeParse({ name: '' });
            expect(result.success).toBe(false);
        });

        it('rejects name over 100 chars', () => {
            const result = createWorkspaceSchema.safeParse({ name: 'a'.repeat(101) });
            expect(result.success).toBe(false);
        });
    });

    describe('createTaskSchema', () => {
        it('accepts minimal task', () => {
            const result = createTaskSchema.safeParse({ title: 'My Task' });
            expect(result.success).toBe(true);
        });

        it('accepts full task', () => {
            const result = createTaskSchema.safeParse({
                title: 'My Task',
                description: 'Description here',
                status: 'in_progress',
                priority: 'high',
                dueDate: '2026-03-25T18:00:00.000Z',
                assigneeUserId: '550e8400-e29b-41d4-a716-446655440000',
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid status', () => {
            const result = createTaskSchema.safeParse({ title: 'Task', status: 'invalid' });
            expect(result.success).toBe(false);
        });

        it('rejects invalid priority', () => {
            const result = createTaskSchema.safeParse({ title: 'Task', priority: 'critical' });
            expect(result.success).toBe(false);
        });

        it('rejects empty title', () => {
            const result = createTaskSchema.safeParse({ title: '' });
            expect(result.success).toBe(false);
        });
    });

    describe('inviteMemberSchema', () => {
        it('accepts valid invite', () => {
            const result = inviteMemberSchema.safeParse({ email: 'user@test.com', role: 'member' });
            expect(result.success).toBe(true);
        });

        it('rejects invalid email', () => {
            const result = inviteMemberSchema.safeParse({ email: 'not-email', role: 'member' });
            expect(result.success).toBe(false);
        });

        it('rejects owner role', () => {
            const result = inviteMemberSchema.safeParse({ email: 'user@test.com', role: 'owner' });
            expect(result.success).toBe(false);
        });
    });

    describe('updateTaskSchema', () => {
        it('accepts partial update', () => {
            const result = updateTaskSchema.safeParse({ status: 'done' });
            expect(result.success).toBe(true);
        });

        it('accepts nullable fields', () => {
            const result = updateTaskSchema.safeParse({ assigneeUserId: null, dueDate: null });
            expect(result.success).toBe(true);
        });
    });

    describe('createNoteSchema', () => {
        it('accepts valid note', () => {
            const result = createNoteSchema.safeParse({ body: 'This looks good!' });
            expect(result.success).toBe(true);
        });

        it('rejects empty body', () => {
            const result = createNoteSchema.safeParse({ body: '' });
            expect(result.success).toBe(false);
        });
    });

    describe('createStoryboardSchema', () => {
        it('accepts valid folder', () => {
            const result = createStoryboardSchema.safeParse({ name: 'Campaign Assets' });
            expect(result.success).toBe(true);
        });

        it('accepts with optional fields', () => {
            const result = createStoryboardSchema.safeParse({
                name: 'Campaign',
                description: 'Main folder',
                parentFolderId: '550e8400-e29b-41d4-a716-446655440000',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('uploadFileSchema', () => {
        it('accepts valid upload params', () => {
            const result = uploadFileSchema.safeParse({
                workspaceId: '550e8400-e29b-41d4-a716-446655440000',
                targetFolderType: 'general',
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid folder type', () => {
            const result = uploadFileSchema.safeParse({
                workspaceId: '550e8400-e29b-41d4-a716-446655440000',
                targetFolderType: 'invalid',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateMemberRoleSchema', () => {
        it('accepts valid role', () => {
            const result = updateMemberRoleSchema.safeParse({ role: 'manager' });
            expect(result.success).toBe(true);
        });

        it('rejects owner role', () => {
            const result = updateMemberRoleSchema.safeParse({ role: 'owner' });
            expect(result.success).toBe(false);
        });
    });
});
