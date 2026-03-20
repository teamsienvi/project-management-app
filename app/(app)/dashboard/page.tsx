import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import { getUserWorkspaces } from '@/lib/permissions';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
    const user = await requireAuth();
    const workspaces = await getUserWorkspaces(user.id);

    // If no workspaces, redirect to onboarding
    if (workspaces.length === 0) {
        redirect('/onboarding');
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return <DashboardClient workspaces={workspaces as any} userId={user.id} />;
}
