'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── Toast Types ────────────────────────────────────────────

interface Toast {
    id: string;
    title: string;
    body?: string;
    priority: string;
    type: string;
    timestamp: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

// ── Priority Colors ────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
    urgent: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)', accent: '#ef4444' },
    high: { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.3)', accent: '#f97316' },
    normal: { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.2)', accent: '#3b82f6' },
    low: { bg: 'rgba(148, 163, 184, 0.06)', border: 'rgba(148, 163, 184, 0.2)', accent: '#94a3b8' },
};

const TYPE_ICONS: Record<string, string> = {
    task_assigned: '📋',
    task_completed: '✅',
    task_due_soon: '⏰',
    file_uploaded: '📎',
    workspace_invite: '💌',
    member_added: '👋',
};

// ── Provider Component ─────────────────────────────────────

interface ToastProviderProps {
    children?: React.ReactNode;
    userId?: string;
}

export default function ToastProvider({ children, userId }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { ...toast, id, timestamp: Date.now() }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Auto-dismiss toasts
    useEffect(() => {
        if (toasts.length === 0) return;

        const timers = toasts.map((toast) => {
            const duration = toast.priority === 'urgent' ? 10000 : toast.priority === 'high' ? 7000 : 5000;
            const elapsed = Date.now() - toast.timestamp;
            const remaining = Math.max(duration - elapsed, 0);

            return setTimeout(() => removeToast(toast.id), remaining);
        });

        return () => timers.forEach(clearTimeout);
    }, [toasts, removeToast]);

    // Supabase Realtime subscription for notifications
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        const channel = supabase
            .channel('toast-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const n = payload.new as any;
                    addToast({
                        title: n.title || 'Notification',
                        body: n.body || undefined,
                        priority: n.priority || 'normal',
                        type: n.type || 'info',
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, addToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast Container */}
            <div
                id="toast-container"
                style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 'var(--z-toast)' as any,
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: 8,
                    maxWidth: 380,
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((toast, idx) => {
                    const style = PRIORITY_STYLES[toast.priority] || PRIORITY_STYLES.normal;
                    const icon = TYPE_ICONS[toast.type] || '🔔';

                    return (
                        <div
                            key={toast.id}
                            style={{
                                background: 'rgba(255, 255, 255, 0.97)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: `1px solid ${style.border}`,
                                borderLeft: `4px solid ${style.accent}`,
                                borderRadius: 12,
                                padding: '14px 16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                                animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                pointerEvents: 'auto',
                                display: 'flex',
                                gap: 10,
                                alignItems: 'flex-start',
                                animationDelay: `${idx * 50}ms`,
                            }}
                        >
                            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: toast.body ? 3 : 0,
                                    lineHeight: 1.3,
                                }}>
                                    {toast.title}
                                </div>
                                {toast.body && (
                                    <div style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    } as any}>
                                        {toast.body}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-tertiary)', fontSize: 14, padding: 2,
                                    lineHeight: 1, flexShrink: 0,
                                    transition: 'color var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                                aria-label="Dismiss toast"
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Toast animation keyframes */}
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(100%) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
