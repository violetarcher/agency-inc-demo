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

  if (!roles.includes('Admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const orgId = user?.org_id;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization not found in session.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const members = await managementClient.organizations.getMembers({ id: orgId });
        return res.status(200).json(members.data);
      } catch (error: any) {
        return res.status(error.statusCode || 500).json({ error: error.message });
      }

    case 'POST': // Invite a new member
      try {
        const { email } = req.body; // We only need the email now
        const invitation = await managementClient.organizations.createInvitation(
          { id: orgId },
          {
            invitee: { email: email },
            inviter: { name: user?.name || 'Administrator' },
            client_id: process.env.AUTH0_CLIENT_ID!,
            // The 'roles' property is removed from this payload
          }
        );
        return res.status(201).json(invitation.data);
      } catch (error: any) {
    console.error("Full Auth0 Error:", JSON.stringify(error, null, 2));
    return res.status(error.statusCode || 500).json({ error: error.message });
}

    case 'DELETE': // Remove a member
      try {
        const { memberId } = req.body;
        await managementClient.organizations.removeMembers(
          { id: orgId },
          { members: [memberId] }
        );
        return res.status(204).end();
      } catch (error: any) {
        return res.status(error.statusCode || 500).json({ error: error.message });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});