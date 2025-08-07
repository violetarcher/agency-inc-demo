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

  if (typeof reportId !== 'string') {
    return res.status(400).json({ error: 'Report ID is required.' });
  }

  const reportRef = db.collection('reports').doc(reportId);

  switch (req.method) {
    case 'PUT':
      if (!permissions.includes('edit:reports')) {
        return res.status(403).json({ error: 'Forbidden: Missing permission.' });
      }

      try {
        const reportDoc = await reportRef.get();
        if (!reportDoc.exists) {
          return res.status(404).json({ error: 'Report not found.' });
        }
        
        // Ownership Check: Only the author can edit
        const reportData = reportDoc.data();
        if (reportData?.authorId !== user?.sub) {
          return res.status(403).json({ error: 'Forbidden: You can only edit your own reports.' });
        }

        const updatedData = { ...req.body, updatedAt: new Date().toISOString() };
        await reportRef.update(updatedData);
        return res.status(200).json({ id: reportId, ...updatedData });

      } catch (error) {
        return res.status(500).json({ error: 'Failed to update report.' });
      }

    case 'DELETE':
      if (!permissions.includes('delete:reports')) {
        return res.status(403).json({ error: 'Forbidden: Missing permission.' });
      }

      // MFA Check
      const decodedToken = decodeJwtPayload(session?.idToken!);
      const amr = decodedToken?.amr || [];
      if (!amr.includes('mfa')) {
        return res.status(403).json({ error: 'Forbidden: Multi-factor authentication is required for this action.' });
      }
      
      try {
        await reportRef.delete();
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete report.' });
      }
    
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});