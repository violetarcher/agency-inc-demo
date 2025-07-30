import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { redirect } from 'next/navigation';

// This page will require a login
export default withPageAuthRequired(async function AdminPage() {
  const session = await getSession();
  const user = session?.user;

  const roles = user ? user['https://agency-inc-demo.com/roles'] : [];

  // If the user does not have the 'admin' role, show an access denied message
  if (!roles.includes('admin')) {
    return (
        <div>
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p>You must be an administrator to view this page.</p>
        </div>
    );
  }

  // If the user IS an admin, show the dashboard
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome, {user?.name}. Here are the admin stats.</p>
      </header>
      {/* Add admin-specific components and data here */}
    </div>
  );
});