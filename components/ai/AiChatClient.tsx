'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Workspace {
    id: string;
    name: string;
}

interface Conversation {
    id: string;
    title: string;
    created_at: string;
}

export default function AiChatClient({ workspaces, initialHistory }: { workspaces: Workspace[], initialHistory: Conversation[] }) {
    const supabase = createClient();
    const [history, setHistory] = useState<Conversation[]>(initialHistory);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0]?.id || '');
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [inputValue, setInputValue] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: async () => ({ workspaceId: activeWorkspaceId, conversationId: selectedConvId }),
    }), [activeWorkspaceId, selectedConvId]);

    const { messages, setMessages, sendMessage, status } = useChat({
        id: selectedConvId || 'new',
        transport,
        onFinish({ message }: { message: UIMessage }) {
            // Check for conversation ID from the response
            const lastPart = message.parts?.find((p: any) => p.type === 'text');
            if (lastPart && !selectedConvId) {
                // Optimistically add to history
                const convId = selectedConvId || 'pending';
                setHistory(prev => {
                    if (prev.find(p => p.id === convId)) return prev;
                    return [{ id: convId, title: 'New Conversation', created_at: new Date().toISOString() }, ...prev];
                });
            }
        },
    } as any);

    const isLoading = status === 'submitted' || status === 'streaming';

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const loadConversation = async (convId: string) => {
        setSelectedConvId(convId);
        // @ts-expect-error - ai_messages table exists but not in generated types
        const { data } = await supabase.from('ai_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true }) as any;
        if (data) {
            setMessages(data.map((m: any) => ({
                id: m.id,
                role: m.role,
                parts: [{ type: 'text', text: m.content }],
            })) as any);
        }
    };

    const startNewChat = () => {
        setSelectedConvId(null);
        setMessages([] as any);
        setInputValue('');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue;
        setInputValue('');
        sendMessage({ text });
    };

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const quickActions = [
        { icon: '📋', label: 'Show all tasks', prompt: 'Show me all tasks in this workspace' },
        { icon: '📊', label: 'Project summary', prompt: 'Give me a summary of this project' },
        { icon: '📂', label: 'List Drive files', prompt: 'List all files in the Google Drive for this workspace' },
        { icon: '⚡', label: 'Overdue tasks', prompt: 'Are there any overdue or urgent tasks?' },
    ];

    // Extract text content from a message
    const getMessageText = (m: UIMessage): string => {
        const textParts = m.parts?.filter((p: any) => p.type === 'text') || [];
        return textParts.map((p: any) => p.text).join('') || '';
    };

    const getToolParts = (m: UIMessage): any[] => {
        return m.parts?.filter((p: any) => p.type === 'tool-invocation') || [];
    };

    return (
        <div style={{
            display: 'flex', height: 'calc(100vh - var(--topbar-height) - 40px)',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            background: '#fdfdfe',
        }}>
            
            {/* ═══ Sidebar ═══ */}
            <div style={{
                width: sidebarOpen ? 260 : 0,
                minWidth: sidebarOpen ? 260 : 0,
                background: 'linear-gradient(195deg, #1e1b2e 0%, #16132a 100%)',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                overflow: 'hidden',
                borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
                {/* Sidebar header */}
                <div style={{ padding: '20px 16px 12px' }}>
                    <button onClick={startNewChat} style={{
                        width: '100%', padding: '11px 16px',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.2) 100%)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 10, cursor: 'pointer',
                        color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.15s',
                        letterSpacing: '0.01em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(59,130,246,0.35) 100%)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.2) 100%)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                    >
                        <span style={{ fontSize: 16 }}>✦</span> New Thread
                    </button>
                </div>

                {/* Workspace selector */}
                <div style={{ padding: '4px 16px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, paddingLeft: 2 }}>Context</div>
                    <select
                        value={activeWorkspaceId}
                        onChange={(e) => setActiveWorkspaceId(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, color: 'rgba(255,255,255,0.8)',
                            fontSize: 12, fontWeight: 500, outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {workspaces.map(w => (
                            <option key={w.id} value={w.id} style={{ background: '#1e1b2e', color: '#fff' }}>{w.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

                {/* History */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '4px 6px 8px', }}>History</div>
                    {history.length === 0 ? (
                        <div style={{ padding: '12px 6px', color: 'rgba(255,255,255,0.25)', fontSize: 12, fontStyle: 'italic' }}>No conversations yet</div>
                    ) : (history.map(conv => (
                        <button key={conv.id} onClick={() => loadConversation(conv.id)} style={{
                            width: '100%', textAlign: 'left', padding: '9px 10px',
                            background: selectedConvId === conv.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                            border: selectedConvId === conv.id ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                            borderRadius: 8, cursor: 'pointer',
                            color: selectedConvId === conv.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                            fontSize: 12, fontWeight: selectedConvId === conv.id ? 600 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 2, transition: 'all 0.12s',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => { if (selectedConvId !== conv.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}}
                        onMouseLeave={e => { if (selectedConvId !== conv.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}}
                        >
                            <span style={{ fontSize: 11, opacity: 0.5 }}>💬</span>
                            {conv.title}
                        </button>
                    )))}
                </div>

                {/* Sidebar footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Gemini 2.5 Flash</span>
                </div>
            </div>

            {/* ═══ Main Chat Area ═══ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fdfdfe', position: 'relative' }}>
                
                {/* Topbar */}
                <div style={{
                    padding: '12px 20px', 
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                    zIndex: 2,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                background: 'none', border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                                fontSize: 14, color: '#666', lineHeight: 1,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                            aria-label="Toggle sidebar"
                        >☰</button>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', letterSpacing: '-0.01em' }}>Sienvi Intelligence</div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                                Connected to <strong style={{ color: '#6c5ce7' }}>{activeWorkspace?.name || 'workspace'}</strong>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.06))',
                        border: '1px solid rgba(124,58,237,0.12)',
                    }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6c5ce7' }}>Online</span>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '24px 0',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {messages.length === 0 ? (
                        /* ═══ Empty State ═══ */
                        <div style={{ 
                            margin: 'auto', textAlign: 'center', 
                            padding: '0 24px', maxWidth: 560,
                        }}>
                            {/* Animated orb */}
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)',
                                margin: '0 auto 24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(59,130,246,0.1)',
                                animation: 'pulse 3s ease-in-out infinite',
                                position: 'relative',
                            }}>
                                <span style={{ fontSize: 36, filter: 'brightness(2)' }}>✦</span>
                                <div style={{
                                    position: 'absolute', inset: -4, borderRadius: '50%',
                                    border: '1px solid rgba(124,58,237,0.15)',
                                    animation: 'pulse 3s ease-in-out infinite 0.5s',
                                }} />
                            </div>
                            <h2 style={{ 
                                fontSize: 26, fontWeight: 700, color: '#1a1a2e',
                                letterSpacing: '-0.02em', marginBottom: 8,
                                fontFamily: 'var(--font-heading)',
                            }}>What can I help you with?</h2>
                            <p style={{ 
                                color: '#8a8a9a', fontSize: 14, lineHeight: 1.6, 
                                marginBottom: 32,
                            }}>
                                I&apos;m connected to <strong style={{ color: '#6c5ce7' }}>{activeWorkspace?.name}</strong>&apos;s 
                                Drive files and tasks. I can search documents, create tasks, and summarize your project data.
                            </p>

                            {/* Quick actions grid */}
                            <div style={{ 
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, 
                                maxWidth: 420, margin: '0 auto',
                            }}>
                                {quickActions.map((qa, i) => (
                                    <button key={i} onClick={() => {
                                        setInputValue(qa.prompt);
                                        // Let the user see it before sending
                                        setTimeout(() => {
                                            sendMessage({ text: qa.prompt });
                                            setInputValue('');
                                        }, 100);
                                    }}
                                    style={{
                                        padding: '14px 16px', textAlign: 'left',
                                        background: 'white',
                                        border: '1px solid rgba(0,0,0,0.07)',
                                        borderRadius: 12, cursor: 'pointer',
                                        transition: 'all 0.18s',
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                    }}
                                    onMouseEnter={e => { 
                                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; 
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.08)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => { 
                                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; 
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                    >
                                        <span style={{ fontSize: 18 }}>{qa.icon}</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#3a3a4a', lineHeight: 1.3 }}>{qa.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* ═══ Messages ═══ */
                        <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '0 24px' }}>
                            {messages.map((m) => {
                                const text = getMessageText(m);
                                const tools = getToolParts(m);
                                return (
                                    <div key={m.id} style={{
                                        display: 'flex',
                                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: 20,
                                    }}>
                                        {m.role === 'assistant' && (
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginRight: 10, marginTop: 2,
                                                fontSize: 14,
                                            }}>
                                                <span style={{ filter: 'brightness(2)' }}>✦</span>
                                            </div>
                                        )}
                                        <div style={{
                                            maxWidth: '80%',
                                            padding: m.role === 'user' ? '12px 18px' : '14px 18px',
                                            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                                            background: m.role === 'user'
                                                ? 'linear-gradient(135deg, #7c3aed, #6c5ce7)'
                                                : '#fff',
                                            color: m.role === 'user' ? '#fff' : '#2a2a3a',
                                            border: m.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                            boxShadow: m.role === 'user'
                                                ? '0 4px 16px rgba(124,58,237,0.2)'
                                                : '0 2px 12px rgba(0,0,0,0.04)',
                                            fontSize: 14, lineHeight: 1.65,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {text || (!text && tools.length > 0 && (
                                                <span style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.7)' : '#999', fontStyle: 'italic' }}>Processing…</span>
                                            ))}
                                            {tools.map((ti: any, idx: number) => (
                                                <div key={idx} style={{
                                                    marginTop: 10, padding: '8px 12px',
                                                    background: m.role === 'user' ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.04)',
                                                    borderRadius: 8,
                                                    border: m.role === 'user' ? '1px solid rgba(255,255,255,0.15)' : '1px dashed rgba(124,58,237,0.15)',
                                                    fontSize: 11, display: 'flex', alignItems: 'center', gap: 6,
                                                    color: m.role === 'user' ? 'rgba(255,255,255,0.8)' : '#7c3aed',
                                                    fontWeight: 500,
                                                }}>
                                                    <span style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚙</span>
                                                    {(ti.toolInvocation?.toolName || ti.toolName || 'tool').replace(/_/g, ' ')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginRight: 10, marginTop: 2, fontSize: 14,
                                    }}>
                                        <span style={{ filter: 'brightness(2)', animation: 'pulse 1.5s ease-in-out infinite' }}>✦</span>
                                    </div>
                                    <div style={{
                                        padding: '14px 18px', borderRadius: '4px 18px 18px 18px',
                                        background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    }}>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s ease-in-out infinite' }} />
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c5ce7', animation: 'pulse 1s ease-in-out infinite 0.2s' }} />
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s ease-in-out infinite 0.4s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* ═══ Input Bar ═══ */}
                <div style={{
                    padding: '16px 24px 20px',
                    background: 'linear-gradient(to top, #fdfdfe 60%, transparent)',
                }}>
                    <form id="ai-chat-form" onSubmit={handleFormSubmit}>
                        <div style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 16, padding: '6px 6px 6px 20px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s',
                            maxWidth: 720, margin: '0 auto', width: '100%',
                        }}>
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={`Ask about ${activeWorkspace?.name || 'your workspace'}...`}
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    background: 'transparent', fontSize: 14,
                                    fontFamily: 'var(--font-family)',
                                    color: '#1a1a2e', lineHeight: 1.4,
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                style={{
                                    width: 38, height: 38, borderRadius: 12, border: 'none',
                                    background: inputValue.trim() && !isLoading
                                        ? 'linear-gradient(135deg, #7c3aed, #6c5ce7)'
                                        : '#e8e8ee',
                                    color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    boxShadow: inputValue.trim() && !isLoading ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                                    fontSize: 16, fontWeight: 700,
                                    flexShrink: 0,
                                }}
                            >
                                ↑
                            </button>
                        </div>
                    </form>
                    <div style={{ 
                        textAlign: 'center', marginTop: 10, 
                        fontSize: 11, color: '#b0b0c0',
                    }}>
                        Sienvi Intelligence may produce inaccurate results. Verify important data.
                    </div>
                </div>
            </div>
        </div>
    );
}
