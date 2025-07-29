import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import ReportDashboard from '@/components/report-dashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define a type for our reports
type Report = {
  id: string;
  title: string;
  amount: number;
  author: string;
  createdAt: string;
};

export default withPageAuthRequired(async function Dashboard() {
  const session = await getSession();
  const user = session?.user;
  
  // This is the corrected line:
  const permissions = session?.accessTokenScope?.split(' ') || [];
  
  const initialReports: Report[] = [];

  return (
    <div className="container mx-auto py-10">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Agency Inc. Dashboard</h1>
            <p className="text-gray-500">Welcome, {user?.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/auth/logout">Logout</Link>
        </Button>
      </header>
      
      <ReportDashboard permissions={permissions} />
    </div>
  );
}, { returnTo: '/dashboard' });