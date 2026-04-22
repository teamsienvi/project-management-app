import { z } from 'zod';

// ── Smart Task Extraction ──────────────────────────────────

export const ExtractedTaskSchema = z.object({
    title: z.string().min(1),
    assignee: z.string().default(''),
    deadline: z.string().default(''),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const ExtractionResultSchema = z.object({
    tasks: z.array(ExtractedTaskSchema),
});

export type ExtractedTask = z.infer<typeof ExtractedTaskSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ── Smart Color Suggestion ─────────────────────────────────

export const VALID_COLORS = ['gray', 'red', 'orange', 'amber', 'green', 'blue', 'indigo', 'pink'] as const;
export type TaskColor = typeof VALID_COLORS[number];

export const ColorSuggestionSchema = z.object({
    color: z.enum(VALID_COLORS),
    reasoning: z.string(),
});

export type ColorSuggestion = z.infer<typeof ColorSuggestionSchema>;

// ── Intelligent Notification ───────────────────────────────

export const NotificationDecisionSchema = z.object({
    shouldNotify: z.boolean(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    reasoning: z.string(),
});

export type NotificationDecision = z.infer<typeof NotificationDecisionSchema>;
