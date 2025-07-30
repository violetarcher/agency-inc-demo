import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { managementClient } from "@/lib/auth0-mgmt-client";
import { MemberManager } from "@/components/admin/member-manager";

// Helper function to check for admin role
const isAdmin = (session: any): boolean => {
    const roles = session?.user?.['https://agency-inc-demo.com/roles'] || [];
    return roles.includes('Admin');
};

// This Server Component will fetch initial data
async function AdminPage() {
    const session = await getSession();

    if (!isAdmin(session)) {
        return (
            <div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You must be an administrator to view this page.</p>
            </div>
        );
    }
    
    // Fetch data from our own API routes
    const orgId = session?.user.org_id;
    const [membersRes, rolesRes] = await Promise.all([
        managementClient.organizations.getMembers({ id: orgId }),
        managementClient.roles.getAll(),
    ]);

    const initialMembers = membersRes.data;
    const availableRoles = rolesRes.data;

    return (
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage organization members and their roles.</p>
          </header>
          <MemberManager initialMembers={initialMembers} availableRoles={availableRoles} />
        </div>
    );
}

// Wrap the page with the login protector
export default withPageAuthRequired(AdminPage, { returnTo: '/admin' });