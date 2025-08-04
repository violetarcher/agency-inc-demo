import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '../../../../lib/auth0-session-manager';

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No session found' });
    }

    const { user } = session;
    const sessions = await Auth0SessionManager.getUserSessions(user.sub);

    // Format sessions for frontend consumption
    const formattedSessions = sessions.map(s => ({
      id: s.id,
      createdAt: s.created_at,
      lastActivity: s.updated_at,
      lastInteracted: s.last_interacted_at,
      expiresAt: s.expires_at,
      device: {
        userAgent: s.device?.last_user_agent || s.device?.initial_user_agent,
        ipAddress: s.device?.last_ip || s.device?.initial_ip
      },
      clients: s.clients,
      authentication: s.authentication
    }));

    res.status(200).json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
      currentSessionId: session.user['https://agency-inc-demo.com/session_id']
    });
  } catch (error) {
    console.error('Session list error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});