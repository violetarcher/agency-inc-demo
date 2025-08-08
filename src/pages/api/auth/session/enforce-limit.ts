// src/pages/api/auth/session/enforce-limit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '../../../../lib/auth0-session-manager';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No session found' });
    }

    const { user } = session;
    const roles = user['https://agency-inc-demo.com/roles'] || [];
    
    // Check if user is admin
    if (!roles.includes('Admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentSessionId = session.user['https://agency-inc-demo.com/session_id'];

    // Enforce single session limit for current user
    const result = await Auth0SessionManager.enforceSingleSession(
      user.sub, 
      currentSessionId
    );

    res.status(200).json({
      success: true,
      terminatedCount: result.terminatedCount,
      remainingSession: result.remainingSession?.id,
      message: result.terminatedCount > 0 
        ? `Terminated ${result.terminatedCount} other session(s)`
        : 'No other sessions found'
    });
  } catch (error) {
    console.error('Session limit enforcement error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});