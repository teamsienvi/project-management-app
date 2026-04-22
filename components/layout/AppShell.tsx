'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ToastProvider from '@/components/notifications/ToastProvider';
import './app-layout.css';

interface Workspace {
    workspace_id: string;
    role: string;
    workspaces: {
        id: string;
        name: string;
        slug: string;
    };
}

interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    read_at: string | null;
    created_at: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const currentWorkspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1];
    const currentWorkspace = workspaces.find(ws => ws.workspace_id === currentWorkspaceId);

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const [profileRes, workspacesRes, notifRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('workspace_members').select('workspace_id, role, workspaces(id, name, slug)').eq('user_id', user.id),
            supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (workspacesRes.data) setWorkspaces(workspacesRes.data as unknown as Workspace[]);
        if (notifRes.data) setNotifications(notifRes.data);
    }, [supabase]);

    // Realtime subscription: update notification badge count live
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel('shell-notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            }, (payload) => {
                const n = payload.new as any;
                setNotifications((prev) => [{
                    id: n.id, type: n.type, title: n.title,
                    body: n.body, read_at: null, created_at: n.created_at,
                }, ...prev]);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const markNotificationRead = async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const navItems = [
        { label: 'Home', href: currentWorkspaceId ? `/workspace/${currentWorkspaceId}` : '/dashboard', icon: '⌂' },
        { label: 'Calendar', href: '/calendar', icon: '📅' },
        { label: 'Sienvi AI', href: '/ai', icon: '✨' },
        ...(currentWorkspaceId
            ? [
                { label: 'Tasks', href: `/workspace/${currentWorkspaceId}/tasks`, icon: '☑' },
                { label: 'Meetings', href: `/workspace/${currentWorkspaceId}/meetings`, icon: '🎤' },
                { label: 'Storyboards', href: `/workspace/${currentWorkspaceId}/storyboards`, icon: '▦' },
                { label: 'Files', href: `/workspace/${currentWorkspaceId}/files`, icon: '◫' },
                { label: 'Members', href: `/workspace/${currentWorkspaceId}/members`, icon: '⊕' },
            ]
            : []),
    ];

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand gradient-text">⬡ Sienvi Nexus</div>
                    <button
                        className="btn btn-ghost btn-icon sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? '▸' : '◂'}
                    </button>
                </div>

                {/* Workspace Switcher */}
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Workspaces</div>
                    <div className="workspace-list">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.workspace_id}
                                className={`workspace-item ${currentWorkspaceId === ws.workspace_id ? 'active' : ''}`}
                                onClick={() => router.push(`/workspace/${ws.workspace_id}`)}
                            >
                                <span className="workspace-icon">{ws.workspaces.name[0]?.toUpperCase() || '?'}</span>
                                {!sidebarCollapsed && <span className="workspace-name">{ws.workspaces.name}</span>}
                            </button>
                        ))}
                        <button
                            className="workspace-item add-workspace"
                            onClick={() => router.push('/onboarding')}
                        >
                            <span className="workspace-icon">+</span>
                            {!sidebarCollapsed && <span className="workspace-name">New Workspace</span>}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => router.push(item.href)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        className="nav-item"
                        onClick={() => router.push('/settings/profile')}
                    >
                        <span className="nav-icon">⚙</span>
                        {!sidebarCollapsed && <span className="nav-label">Settings</span>}
                    </button>
                    {profile?.is_admin && (
                        <button
                            className="nav-item"
                            onClick={() => router.push('/admin')}
                        >
                            <span className="nav-icon">⛊</span>
                            {!sidebarCollapsed && <span className="nav-label">Admin</span>}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main content area */}
            <div className="app-main">
                {/* Top bar */}
                <header className="topbar">
                    <div className="topbar-left">
                        {currentWorkspace ? (
                            <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {currentWorkspace.workspaces.name}
                            </div>
                        ) : (
                            <div className="topbar-search">
                                <span className="search-icon">⌕</span>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="search-input"
                                    aria-label="Search"
                                />
                                <kbd className="search-kbd">⌘K</kbd>
                            </div>
                        )}
                    </div>

                    <div className="topbar-right">
                        {/* Notifications */}
                        <div className="notif-container" ref={notifRef}>
                            <button
                                className="btn btn-ghost btn-icon notif-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label="Notifications"
                            >
                                🔔
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>
                            {showNotifications && (
                                <div className="dropdown-menu notif-dropdown">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ fontSize: 11, padding: '2px 8px', color: 'var(--text-link)' }}
                                            onClick={() => { setShowNotifications(false); router.push('/notifications'); }}
                                        >
                                            View All
                                        </button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">No notifications</div>
                                    ) : (
                                        notifications.slice(0, 10).map((n) => (
                                            <button
                                                key={n.id}
                                                className={`notif-item ${!n.read_at ? 'unread' : ''}`}
                                                onClick={() => markNotificationRead(n.id)}
                                            >
                                                <div className="notif-item-title">{n.title}</div>
                                                {n.body && <div className="notif-item-body">{n.body}</div>}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="user-menu-container" ref={userMenuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="User menu"
                            >
                                <div className="avatar avatar-sm">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" />
                                    ) : (
                                        getInitials(profile?.full_name || null)
                                    )}
                                </div>
                            </button>
                            {showUserMenu && (
                                <div className="dropdown-menu user-dropdown">
                                    <div className="dropdown-user-info">
                                        <div className="dropdown-user-name">{profile?.full_name || 'User'}</div>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={() => router.push('/settings/profile')}>
                                        Profile Settings
                                    </button>
                                    <button className="dropdown-item" onClick={() => router.push('/settings/notifications')}>
                                        Notification Settings
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={handleSignOut}>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="app-content fade-in">
                    {children}
                </main>
            </div>

            {/* Toast notification system */}
            <ToastProvider userId={userId} />
        </div>
    );
}
