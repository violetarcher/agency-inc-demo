import { NextRequest } from 'next/server';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { Auth0SessionManager } from '@/lib/auth0-session-manager';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'No session found' }, { status: 401 });
    }

    const { user } = session;
    const roles = user['https://agency-inc-demo.com/roles'] || [];
    
    // Check if user is admin
    if (!roles.includes('Admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const currentSessionId = session.user['https://agency-inc-demo.com/session_id'];

    // Enforce single session limit for current user
    const result = await Auth0SessionManager.enforceSingleSession(
      user.sub, 
      currentSessionId
    );

    return Response.json({
      success: true,
      terminatedCount: result.terminatedCount,
      remainingSession: result.remainingSession?.id,
      message: result.terminatedCount > 0 
        ? `Terminated ${result.terminatedCount} other session(s)`
        : 'No other sessions found'
    });
  } catch (error: any) {
    console.error('Session limit enforcement error:', error);
    return Response.json(
      { 
        error: 'Internal server error', 
        details: error?.message 
      },
      { status: 500 }
    );
  }
});