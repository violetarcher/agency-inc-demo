import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import ReportDashboard from '@/components/report-dashboard';

export default withPageAuthRequired(async function ReportsPage() {
  const session = await getSession();
  const permissions = session?.accessTokenScope?.split(' ') || [];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Expense Reports</h1>
        <p className="text-gray-500">Manage reports for Agency Inc.</p>
      </header>

      <ReportDashboard permissions={permissions} />
    </div>
  );
}, { returnTo: '/reports' }); // Return to this page after login