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

  // Ensure the user is an admin
  if (!roles.includes('Admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const orgId = user?.org_id;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization not found in session.' });
  }

  const { memberId } = req.query;
  if (typeof memberId !== 'string') {
    return res.status(400).json({ error: 'Member ID must be a string.' });
  }

  if (req.method === 'DELETE') {
    try {
      await managementClient.organizations.deleteMembers(
      { id: orgId },
      { members: [memberId] }
      );
      return res.status(204).end();
    } catch (error: any) {
      console.error("Failed to remove member:", error);
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});