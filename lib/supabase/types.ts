/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Database type definitions for Supabase.
 *
 * NOTE: In production, generate this file using the Supabase CLI:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/supabase/types.ts
 *
 * This file provides the correct structure so queries are properly typed.
 * We use `any` as a pragmatic workaround for the Row/Insert/Update types
 * since the actual schema is validated server-side via Zod and enforced by Postgres.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    is_admin: boolean;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    is_admin?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    is_admin?: boolean;
                    created_at?: string;
                };
                Relationships: [];
            };
            workspaces: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    created_by: string;
                    google_drive_root_folder_id: string | null;
                    google_drive_storyboards_folder_id: string | null;
                    google_drive_general_files_folder_id: string | null;
                    google_drive_task_attachments_folder_id: string | null;
                    join_code: string;
                    join_code_enabled: boolean;
                    join_code_last_rotated_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    created_by: string;
                    google_drive_root_folder_id?: string | null;
                    google_drive_storyboards_folder_id?: string | null;
                    google_drive_general_files_folder_id?: string | null;
                    google_drive_task_attachments_folder_id?: string | null;
                    join_code?: string;
                    join_code_enabled?: boolean;
                    join_code_last_rotated_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    created_by?: string;
                    google_drive_root_folder_id?: string | null;
                    google_drive_storyboards_folder_id?: string | null;
                    google_drive_general_files_folder_id?: string | null;
                    google_drive_task_attachments_folder_id?: string | null;
                    join_code?: string;
                    join_code_enabled?: boolean;
                    join_code_last_rotated_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            workspace_members: {
                Row: {
                    id: string;
                    workspace_id: string;
                    user_id: string;
                    role: string;
                    joined_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    user_id: string;
                    role: string;
                    joined_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    user_id?: string;
                    role?: string;
                    joined_at?: string;
                };
                Relationships: [];
            };
            workspace_invitations: {
                Row: {
                    id: string;
                    workspace_id: string;
                    email: string;
                    role: string;
                    invited_by: string;
                    token: string;
                    status: string;
                    expires_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    email: string;
                    role: string;
                    invited_by: string;
                    token: string;
                    status?: string;
                    expires_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    email?: string;
                    role?: string;
                    invited_by?: string;
                    token?: string;
                    status?: string;
                    expires_at?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            tasks: {
                Row: {
                    id: string;
                    workspace_id: string;
                    title: string;
                    description: string | null;
                    status: string;
                    priority: string;
                    due_date: string | null;
                    assignee_user_id: string | null;
                    created_by: string;
                    completed_at: string | null;
                    completed_by: string | null;
                    archived_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    title: string;
                    description?: string | null;
                    status?: string;
                    priority?: string;
                    due_date?: string | null;
                    assignee_user_id?: string | null;
                    created_by: string;
                    completed_at?: string | null;
                    completed_by?: string | null;
                    archived_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    title?: string;
                    description?: string | null;
                    status?: string;
                    priority?: string;
                    due_date?: string | null;
                    assignee_user_id?: string | null;
                    created_by?: string;
                    completed_at?: string | null;
                    completed_by?: string | null;
                    archived_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            task_notes: {
                Row: {
                    id: string;
                    task_id: string;
                    workspace_id: string;
                    body: string;
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    task_id: string;
                    workspace_id: string;
                    body: string;
                    created_by: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    task_id?: string;
                    workspace_id?: string;
                    body?: string;
                    created_by?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            task_watchers: {
                Row: {
                    id: string;
                    task_id: string;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    task_id: string;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    task_id?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            task_activity: {
                Row: {
                    id: string;
                    task_id: string;
                    workspace_id: string;
                    actor_user_id: string;
                    event_type: string;
                    metadata_json: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    task_id: string;
                    workspace_id: string;
                    actor_user_id: string;
                    event_type: string;
                    metadata_json?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    task_id?: string;
                    workspace_id?: string;
                    actor_user_id?: string;
                    event_type?: string;
                    metadata_json?: Json;
                    created_at?: string;
                };
                Relationships: [];
            };
            storyboard_folders: {
                Row: {
                    id: string;
                    workspace_id: string;
                    parent_folder_id: string | null;
                    name: string;
                    description: string | null;
                    google_drive_folder_id: string | null;
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    parent_folder_id?: string | null;
                    name: string;
                    description?: string | null;
                    google_drive_folder_id?: string | null;
                    created_by: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    parent_folder_id?: string | null;
                    name?: string;
                    description?: string | null;
                    google_drive_folder_id?: string | null;
                    created_by?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            storyboard_notes: {
                Row: {
                    id: string;
                    workspace_id: string;
                    storyboard_folder_id: string | null;
                    title: string;
                    content: string;
                    format: string;
                    created_by: string;
                    updated_by: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    storyboard_folder_id?: string | null;
                    title?: string;
                    content?: string;
                    format?: string;
                    created_by: string;
                    updated_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    storyboard_folder_id?: string | null;
                    title?: string;
                    content?: string;
                    format?: string;
                    created_by?: string;
                    updated_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [];
            };
            file_assets: {
                Row: {
                    id: string;
                    workspace_id: string;
                    storyboard_folder_id: string | null;
                    task_id: string | null;
                    storage_provider: string;
                    google_drive_file_id: string;
                    google_drive_folder_id: string;
                    google_drive_web_view_link: string | null;
                    original_name: string;
                    mime_type: string | null;
                    size_bytes: number | null;
                    uploaded_by: string;
                    created_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    workspace_id: string;
                    storyboard_folder_id?: string | null;
                    task_id?: string | null;
                    storage_provider?: string;
                    google_drive_file_id: string;
                    google_drive_folder_id: string;
                    google_drive_web_view_link?: string | null;
                    original_name: string;
                    mime_type?: string | null;
                    size_bytes?: number | null;
                    uploaded_by: string;
                    created_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    workspace_id?: string;
                    storyboard_folder_id?: string | null;
                    task_id?: string | null;
                    storage_provider?: string;
                    google_drive_file_id?: string;
                    google_drive_folder_id?: string;
                    google_drive_web_view_link?: string | null;
                    original_name?: string;
                    mime_type?: string | null;
                    size_bytes?: number | null;
                    uploaded_by?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [];
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    workspace_id: string | null;
                    type: string;
                    title: string;
                    body: string | null;
                    metadata_json: Json;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    workspace_id?: string | null;
                    type: string;
                    title: string;
                    body?: string | null;
                    metadata_json?: Json;
                    read_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                    type?: string;
                    title?: string;
                    body?: string | null;
                    metadata_json?: Json;
                    read_at?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            admin_audit_logs: {
                Row: {
                    id: string;
                    admin_user_id: string;
                    action: string;
                    target_type: string;
                    target_id: string | null;
                    metadata_json: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    admin_user_id: string;
                    action: string;
                    target_type: string;
                    target_id?: string | null;
                    metadata_json?: Json;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    admin_user_id?: string;
                    action?: string;
                    target_type?: string;
                    target_id?: string | null;
                    metadata_json?: Json;
                    created_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            is_workspace_member: {
                Args: { ws_id: string };
                Returns: boolean;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
