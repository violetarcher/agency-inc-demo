// src/pages/api/auth/session/validate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { isSessionRevoked } from '../backchannel-logout';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ 
        valid: false, 
        error: 'No session found' 
      });
    }

    const user = session.user;
    const sessionId = user['https://agency-inc-demo.com/session_id'];

    console.log(`🔍 Validating session ${sessionId} for user ${user.sub}`);

    // Check if this session has been revoked via back-channel logout
    if (sessionId && isSessionRevoked(sessionId)) {
      console.log(`❌ Session ${sessionId} is revoked`);
      return res.status(401).json({ 
        valid: false, 
        reason: 'session_revoked',
        sessionId 
      });
    }

    console.log(`✅ Session ${sessionId} is valid`);
    res.status(200).json({ 
      valid: true, 
      sessionId,
      userId: user.sub
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    });
  }
});