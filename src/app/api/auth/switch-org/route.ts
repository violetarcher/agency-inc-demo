import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    console.log('🔄 Switching to organization:', organizationId);
    console.log('🔍 Session keys:', Object.keys(session));
    console.log('🔍 Has refresh token?', !!session.refreshToken);

    // Check if we have a refresh token
    if (!session.refreshToken) {
      console.error('❌ No refresh token in session');
      return NextResponse.json(
        {
          error: 'No refresh token available',
          message: 'Please log out and log back in to enable silent org switching',
          requiresReauth: true
        },
        { status: 400 }
      );
    }

    // Get a new access token for the new organization using the refresh token
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        refresh_token: session.refreshToken,
        organization: organizationId,
        scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('❌ Token refresh failed:', error);
      return NextResponse.json(
        { error: 'Failed to switch organization', details: error },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Got new tokens for organization');

    // Update the session with new tokens
    // Note: This requires a page reload to pick up the new session
    // We'll return a flag to tell the client to reload

    return NextResponse.json({
      success: true,
      message: 'Organization switched successfully',
      requiresReload: true,
    });
  } catch (error: any) {
    console.error('❌ Error switching organization:', error);
    return NextResponse.json(
      { error: 'Failed to switch organization', details: error.message },
      { status: 500 }
    );
  }
}
