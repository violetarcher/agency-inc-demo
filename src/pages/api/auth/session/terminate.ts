// src/pages/api/auth/session/terminate.ts - Updated existing file
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

    const { user } = session;
    const roles = user['https://agency-inc-demo.com/roles'] || [];
    
    // Check if user is admin (NEW: Admin check added)
    if (!roles.includes('Admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const currentSessionId = session.user['https://agency-inc-demo.com/session_id'];
    
    // NEW: Warn if user is trying to terminate their own session
    if (sessionId === currentSessionId) {
      console.log(`⚠️ Admin ${user.sub} is terminating their own session ${sessionId}`);
    }

    await Auth0SessionManager.deleteSession(sessionId);

    res.status(200).json({
      success: true,
      message: `Session ${sessionId} terminated successfully`,
      sessionId,
      wasOwnSession: sessionId === currentSessionId // NEW: Additional info
    });
  } catch (error) {
    console.error('Session termination error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});