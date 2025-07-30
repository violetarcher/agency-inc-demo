import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const session = await getSession(req, res);
    const roles = session?.user?.['https://agency-inc-demo.com/roles'] || [];

    // Ensure the user is an admin
    if (!roles.includes('admin')) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const roles = await managementClient.roles.getAll();
        return res.status(200).json(roles.data);
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});