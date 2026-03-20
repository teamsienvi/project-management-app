import { requireAdmin } from '@/lib/auth/helpers';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();
    return <AppShell>{children}</AppShell>;
}
