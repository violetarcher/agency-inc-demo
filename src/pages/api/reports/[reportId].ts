import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { db } from '../../../lib/firebase-admin'; // Adjust path if needed

// Helper function to decode JWT
function decodeJwtPayload(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (e) {
    return null;
  }
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  const user = session?.user;
  const permissions = session?.accessTokenScope?.split(' ') || [];
  const { reportId } = req.query;

  if (req.method === 'DELETE') {
    if (!permissions.includes('delete:reports')) {
      return res.status(403).json({ error: 'Forbidden: Missing permission.' });
    }

    // --- NEW SECURITY CHECK ---
    // Decode the access token to check for MFA
    const decodedToken = decodeJwtPayload(session?.idToken!);
    console.log('--- Access Token on DELETE ---');
    console.log(JSON.stringify(decodedToken, null, 2));
    console.log('----------------------------');
    
    const amr = decodedToken?.amr || []; // amr = Authentication Methods References
    if (!amr.includes('mfa')) {
      return res.status(403).json({ error: 'Forbidden: Multi-factor authentication is required for this action.' });
    }
    // --- END SECURITY CHECK ---

    try {
      await db.collection('reports').doc(reportId as string).delete();
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete report.' });
    }
  }

  // Handle other methods like PUT if needed
  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
});