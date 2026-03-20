import './auth-layout.css';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-shell">
            <div className="auth-bg-effect" />
            <div className="auth-container">
                <div className="auth-brand">
                    <h1 className="gradient-text">⬡ IWPM</h1>
                    <p className="auth-subtitle">Internal Workspace Project Manager</p>
                </div>
                <div className="auth-card glass-card">
                    {children}
                </div>
            </div>
        </div>
    );
}
