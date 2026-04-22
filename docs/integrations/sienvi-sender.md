# Sienvi Sender Integration — Reference

> **This is a pointer document.**
> The canonical integration scope lives in the Sienvi Sender repo:
> `sienvi-resend-emailer/docs/INTEGRATION_SCOPE.md`

---

## Summary

Sienvi Sender is the campaign execution layer that integrates with this PM app as its orchestration layer.

The integration is **thin by design** — Sender only syncs the operational fields it needs. It does not replicate PM features.

---

## How the Link Works

| PM App | Sienvi Sender |
|---|---|
| Top-level `tasks` row | One `email_campaigns` row |
| `tasks.sender_campaign_id` | `email_campaigns.pm_task_id` |

One campaign = one top-level PM task. Subtasks, boards, and comments are not synced in v1.

---

## What PM App Owns (Source of Truth)

- Work orchestration
- Task / status management
- Due dates
- Owners (`assignee_user_id`)
- Dependencies
- Approvals record

## What Sender Owns (Source of Truth)

- Campaign setup and funnel logic
- Copy / review workflow
- Send readiness
- Launch execution
- Campaign metrics
- Post-launch outcomes

---

## Sync Direction

All sync is **push / event-driven** via HMAC-SHA256 signed server-to-server HTTP calls. No direct database access between apps.

- PM → Sender: owner changes, due date changes, approval state, blocker flags
- Sender → PM: readiness state, launched status, artifact links, post-launch review creation

---

## What PM Does NOT Build in v1

- Task boards in Sender
- Threaded comments in Sender
- Subtask trees in Sender
- Dependency engine in Sender
- Sprint planning in Sender
- Generic PM dashboards in Sender
- Resource planning in Sender

---

## Canonical Spec

Full event triggers, status definitions, field list, hard-block rules, and signoff:
→ `sienvi-resend-emailer/docs/INTEGRATION_SCOPE.md`
