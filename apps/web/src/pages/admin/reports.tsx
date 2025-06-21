import { AdminRouteGuard } from '@/components/providers/AdminRouteGuard';
import ReportsPage from '@/components/admin/ReportsPage';

export default function ReportsAdmin() {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <ReportsPage />
      </div>
    </AdminRouteGuard>
  );
}
