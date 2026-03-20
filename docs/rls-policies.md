# RLS Policies

All tables have RLS enabled. Access is controlled by workspace membership.

## Helper Function
`is_workspace_member(ws_id)` — returns TRUE if `auth.uid()` is a member of the workspace.

## Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own row only | Auto (trigger) | Own row only | — |
| workspaces | Members only | Creator = self | Members | — |
| workspace_members | Members only | Self or member | Members | — |
| workspace_invitations | Inviter, invitee, or member | Service role | Service role | — |
| tasks | Members | Members (creator=self) | Members | — |
| task_notes | Members | Members (creator=self) | — | — |
| task_watchers | Members (via task) | Self + member | — | Self |
| task_activity | Members | Members (actor=self) | — | — |
| storyboard_folders | Members | Members (creator=self) | Members | — |
| file_assets | Members | Members (uploader=self) | Members | — |
| notifications | Own only | Service role | Own only | — |
| admin_audit_logs | Admins only | Service role | — | — |

## Key Principles
1. **Workspace isolation**: Users can only see data in workspaces they belong to
2. **Self-attribution**: INSERT policies require `created_by`/`actor_user_id` = `auth.uid()`
3. **Role checks above RLS**: Role-based actions (invite, role change) are enforced in API handlers, not just RLS
4. **Service role for sensitive ops**: Invitations, notifications, and audit logs use service role for writes
