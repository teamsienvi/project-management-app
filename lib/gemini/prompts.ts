// ============================================================
// Gemini Prompt Templates — Sienvi Nexus
// All AI prompts are centralized here for maintainability.
// ============================================================

/**
 * Prompt for extracting action items from meeting transcripts/summaries.
 * Input: raw meeting text
 * Output: JSON matching ExtractionResultSchema
 */
export const EXTRACT_TASKS_PROMPT = `You are an expert project manager assistant for Sienvi Nexus.

Your task: Extract actionable tasks from the meeting transcript or summary below.

For each task, identify:
1. **title** — A clear, concise task title (imperative tense, e.g. "Design homepage mockup")
2. **assignee** — The person responsible. Use the name as mentioned in the text. Leave empty ("") if not mentioned.
3. **deadline** — A deadline date in ISO 8601 format (YYYY-MM-DD). Leave empty ("") if not mentioned. If a relative date like "next Friday" is used, calculate from today's date which is: {{today}}.
4. **priority** — One of: "low", "medium", "high", "urgent". Infer from context, urgency words, and deadlines. Default to "medium" if unclear.

Rules:
- Only extract genuine action items (tasks someone needs to do), not discussion points or FYI items.
- If someone says "I'll do X", that's a task assigned to them.
- If there are no actionable tasks, return an empty array.
- Be precise with names — use exactly as mentioned in the transcript.

Respond with ONLY valid JSON matching this structure:
{
  "tasks": [
    { "title": "...", "assignee": "...", "deadline": "...", "priority": "..." }
  ]
}

--- MEETING TEXT ---
{{transcript}}
--- END ---`;

/**
 * Prompt for suggesting a task color based on metadata.
 * Input: task title, description, priority, due date
 * Output: JSON matching ColorSuggestionSchema
 */
export const SUGGEST_COLOR_PROMPT = `You are a color-tagging assistant for a project management tool called Sienvi Nexus.

Suggest a single color tag for the task below based on its urgency, category, and priority.

Available colors and their meanings:
- "red" — Urgent/critical/blocking issues, bugs, emergencies
- "orange" — High priority, time-sensitive, approaching deadlines
- "amber" — Needs attention, moderate urgency, warnings
- "green" — On track, completed sub-items, positive progress, wellness
- "blue" — Technical, engineering, development, infrastructure
- "indigo" — Design, creative, planning, strategy
- "pink" — Marketing, outreach, social, communication, people-related
- "gray" — General, uncategorized, low priority, administrivia

Task details:
- Title: {{title}}
- Description: {{description}}
- Priority: {{priority}}
- Due Date: {{dueDate}}

Respond with ONLY valid JSON:
{ "color": "...", "reasoning": "Brief 1-sentence explanation" }`;

/**
 * Prompt for intelligent notification prioritization.
 * Input: notification context (type, task info, user activity)
 * Output: JSON matching NotificationDecisionSchema
 */
export const PRIORITIZE_NOTIFICATION_PROMPT = `You are a smart notification manager for Sienvi Nexus, a project management platform.

Your job: Decide whether a notification should be sent and at what priority level, to avoid notification spam while ensuring important updates reach users promptly.

Notification context:
- Type: {{notificationType}}
- Title: {{title}}
- Body: {{body}}
- Task Priority: {{taskPriority}}
- Task Due Date: {{taskDueDate}}
- User's Recent Notification Count (last 1hr): {{recentCount}}

Rules:
- If the user already received >10 notifications in the last hour, only send if truly urgent.
- Task completions for high/urgent priority tasks should always notify.
- Low priority task assignments can be batched (set shouldNotify: false if recent count > 5).
- File uploads are low priority unless the task is urgent.
- Workspace invites should always notify.

Respond with ONLY valid JSON:
{
  "shouldNotify": true/false,
  "priority": "low" | "normal" | "high" | "urgent",
  "reasoning": "Brief explanation"
}`;

/**
 * Fill template placeholders: {{key}} → value
 */
export function fillPrompt(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`{{${key}}}`, value || '');
    }
    return result;
}
