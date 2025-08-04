// src/pages/api/test/enforce-session-limit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '../../../lib/auth0-session-manager';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No session found' });
    }

    const userId = session.user.sub;
    
    // Get current sessions
    const beforeSessions = await Auth0SessionManager.getUserSessions(userId);
    console.log(`Before: User has ${beforeSessions.length} sessions`);
    
    // Enforce single session (keep the newest)
    const result = await Auth0SessionManager.enforceSingleSession(userId);
    
    // Get sessions after enforcement
    const afterSessions = await Auth0SessionManager.getUserSessions(userId);
    console.log(`After: User has ${afterSessions.length} sessions`);
    
    res.status(200).json({
      success: true,
      message: 'Session limit enforced',
      before: {
        count: beforeSessions.length,
        sessions: beforeSessions.map(s => ({ id: s.id, created: s.created_at }))
      },
      after: {
        count: afterSessions.length,
        sessions: afterSessions.map(s => ({ id: s.id, created: s.created_at }))
      },
      result: {
        terminatedCount: result.terminatedCount,
        remainingSessionId: result.remainingSession?.id
      }
    });
  } catch (error) {
    console.error('Session enforcement test error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
});