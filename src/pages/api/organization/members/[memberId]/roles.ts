import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  const user = session?.user;
  const roles = user?.['https://agency-inc-demo.com/roles'] || [];

  // Ensure the calling user is an admin
  if (!roles.includes('Admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const orgId = user?.org_id;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization not found in session.' });
  }

  const { memberId } = req.query;
  if (typeof memberId !== 'string') {
    return res.status(400).json({ error: 'Member ID is required.' });
  }

  if (req.method === 'POST') {
    try {
      const { roleIds } = req.body; // New roles to assign

      // Step 1: Get the member's current roles
      const currentRolesResponse = await managementClient.organizations.getMemberRoles({ id: orgId, user_id: memberId });
      const currentRoleIds = currentRolesResponse.data.map(role => role.id);

      // Step 2: Remove all current roles, if any exist
      if (currentRoleIds.length > 0) {
        await managementClient.organizations.deleteMemberRoles(
          { id: orgId, user_id: memberId },
          { roles: currentRoleIds }
        );
      }
      
      // Step 3: Add the new roles, if any were selected
      if (roleIds.length > 0) {
        await managementClient.organizations.addMemberRoles(
          { id: orgId, user_id: memberId },
          { roles: roleIds }
        );
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Full Auth0 Role Assignment Error:", JSON.stringify(error, null, 2));
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});