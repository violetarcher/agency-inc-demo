import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { managementClient } from '@/lib/auth0-mgmt-client';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession(req, res);
  const user = session?.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const accessRequest = {
      role: 'Data Analyst',
      requestDate: new Date().toISOString(),
  };

  try {
    // CORRECTED: Use the general 'update' method and pass the data
    // inside an 'app_metadata' object.
    await managementClient.users.update(
        { id: user.sub },
        { app_metadata: { pending_access_request: accessRequest } }
    );
    
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Failed to prepare access request:", error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});