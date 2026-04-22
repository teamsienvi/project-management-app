import { requireAuth } from '@/lib/auth/helpers';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default async function NotificationsPage() {
    await requireAuth();
    return <NotificationCenter />;
}
