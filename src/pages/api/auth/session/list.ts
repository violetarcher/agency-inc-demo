// src/pages/api/auth/session/list.ts - Updated for organization-wide sessions
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '../../../../lib/auth0-session-manager';
import { managementClient } from '../../../../lib/auth0-mgmt-client';

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
    const roles = user['https://agency-inc-demo.com/roles'] || [];
    
    // Check if user is admin
    if (!roles.includes('Admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get organization ID
    const orgId = user['https://agency-inc-demo.com/org_id'];
    if (!orgId) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    console.log(`🔍 Fetching sessions for all members in organization: ${orgId}`);

    // Get all organization members
    const membersResponse = await managementClient.organizations.getMembers({ id: orgId });
    const members = membersResponse.data;

    console.log(`👥 Found ${members.length} organization members`);

    // Get sessions for each member
    const allSessionsData = await Promise.allSettled(
      members.map(async (member) => {
        try {
          const userSessions = await Auth0SessionManager.getUserSessions(member.user_id);
          return {
            userId: member.user_id,
            userEmail: member.email,
            userName: member.name,
            sessions: userSessions
          };
        } catch (error) {
          console.error(`Failed to get sessions for user ${member.user_id}:`, error);
          return {
            userId: member.user_id,
            userEmail: member.email,
            userName: member.name,
            sessions: [],
            error: error.message
          };
        }
      })
    );

    // Process results and flatten sessions
    const organizationSessions: any[] = [];
    let totalActiveSessions = 0;

    allSessionsData.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.sessions.length > 0) {
        result.value.sessions.forEach((session) => {
          organizationSessions.push({
            id: session.id,
            userId: result.value.userId,
            userEmail: result.value.userEmail,
            userName: result.value.userName,
            createdAt: session.created_at,
            lastActivity: session.updated_at,
            lastInteracted: session.last_interacted_at,
            expiresAt: session.expires_at,
            idleExpiresAt: session.idle_expires_at,
            device: {
              userAgent: session.device?.last_user_agent || session.device?.initial_user_agent,
              ipAddress: session.device?.last_ip || session.device?.initial_ip,
              asn: session.device?.last_asn || session.device?.initial_asn
            },
            clients: session.clients,
            authentication: session.authentication,
            isCurrentUser: result.value.userId === user.sub,
            isCurrentSession: session.id === session.user?.['https://agency-inc-demo.com/session_id']
          });
          totalActiveSessions++;
        });
      }
    });

    // Sort sessions by last activity (most recent first)
    organizationSessions.sort((a, b) => 
      new Date(b.lastInteracted).getTime() - new Date(a.lastInteracted).getTime()
    );

    console.log(`📊 Found ${totalActiveSessions} total active sessions across ${members.length} users`);

    res.status(200).json({
      success: true,
      sessions: organizationSessions,
      count: totalActiveSessions,
      organizationId: orgId,
      memberCount: members.length,
      currentSessionId: session.user['https://agency-inc-demo.com/session_id'],
      currentUserId: user.sub
    });
  } catch (error) {
    console.error('Organization session list error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});