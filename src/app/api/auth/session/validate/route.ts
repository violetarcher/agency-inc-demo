import { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { isSessionRevoked } from '@/lib/session-revocation';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { 
          valid: false, 
          error: 'No session found' 
        },
        { status: 401 }
      );
    }

    const user = session.user;
    const sessionId = user['https://agency-inc-demo.com/session_id'];

    // Check if this session has been revoked via back-channel logout
    if (sessionId && isSessionRevoked(sessionId)) {
      return Response.json(
        { 
          valid: false, 
          reason: 'session_revoked',
          sessionId 
        },
        { status: 401 }
      );
    }

    return Response.json({ 
      valid: true, 
      sessionId,
      userId: user.sub
    });

  } catch (error: any) {
    return Response.json(
      { 
        valid: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}