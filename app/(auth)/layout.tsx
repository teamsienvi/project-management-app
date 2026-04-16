import './auth-layout.css';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-shell">
            <div className="auth-bg-effect" />
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">⬡ Sienvi</h1>
                    <p className="auth-subtitle">Sienvi Nexus</p>
                </div>
                <div className="auth-card glass-card">
                    {children}
                </div>
            </div>
        </div>
    );
}
