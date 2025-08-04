import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '../../../../lib/auth0-session-manager';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No session found' });
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    await Auth0SessionManager.deleteSession(sessionId);

    res.status(200).json({
      success: true,
      message: `Session ${sessionId} terminated successfully`
    });
  } catch (error) {
    console.error('Session termination error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});