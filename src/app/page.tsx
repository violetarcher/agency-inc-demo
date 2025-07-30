// import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
// import ReportDashboard from '@/components/report-dashboard';

export default function HomePage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Agency Inc</h1>
        <p className="text-gray-500">
          Select a feature from the sidebar to get started. Some features may require you to log in.
        </p>
      </header>
      {/* You can add more public content here */}
    </div>
  );
}