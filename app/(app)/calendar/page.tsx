import { requireAuth } from '@/lib/auth/helpers';
import GlobalCalendar from '@/components/calendar/GlobalCalendar';

export default async function CalendarPage() {
    await requireAuth();
    return <GlobalCalendar />;
}
