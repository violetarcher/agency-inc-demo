import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getAccessToken } from '@auth0/nextjs-auth0';

/**
 * GET /api/mfa/auth/test-token
 *
 * Test endpoint to check if the current access token has My Account API audience and scopes.
 * This helps diagnose 404 errors when calling My Account API endpoints.
 *
 * Returns:
 * - Token details including audience, scopes, and expiration
 * - Whether the token is suitable for My Account API calls
 */
export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    // Decode the token (without verification, just for inspection)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid JWT format' },
        { status: 400 }
      );
    }

    const base64UrlDecode = (str: string) => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      const missing = str.length % 4;
      if (missing) {
        str += '='.repeat(4 - missing);
      }
      return str;
    };

    const payload = JSON.parse(Buffer.from(base64UrlDecode(parts[1]), 'base64').toString('utf-8'));

    // Expected My Account API audience
    const expectedAudience = `${process.env.AUTH0_ISSUER_BASE_URL}/me/`;
    const actualAudience = payload.aud;
    const scopes = (payload.scope || '').split(' ');

    // Check for required My Account API scopes (with 'me:' prefix)
    const requiredScopes = [
      'read:me:authentication_methods',
      'create:me:authentication_methods',
      'update:me:authentication_methods',
      'delete:me:authentication_methods',
    ];

    const hasRequiredScopes = requiredScopes.every(s => scopes.includes(s));
    const hasMyAccountAudience = Array.isArray(actualAudience)
      ? actualAudience.includes(expectedAudience)
      : actualAudience === expectedAudience;

    return NextResponse.json({
      success: true,
      token: {
        audience: actualAudience,
        expectedAudience,
        hasMyAccountAudience,
        scopes: scopes,
        requiredScopes,
        hasRequiredScopes,
        issuer: payload.iss,
        subject: payload.sub,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        issuedAt: new Date(payload.iat * 1000).toISOString(),
      },
      diagnosis: {
        canCallMyAccountAPI: hasMyAccountAudience && hasRequiredScopes,
        issues: [
          ...(!hasMyAccountAudience ? ['Token does not have My Account API audience'] : []),
          ...(!hasRequiredScopes ? ['Token is missing required My Account API scopes'] : []),
        ],
        recommendations: [
          ...(!hasMyAccountAudience || !hasRequiredScopes
            ? ['Re-authenticate using the "Re-authenticate" button on the Security tab']
            : []),
          ...(!hasMyAccountAudience || !hasRequiredScopes
            ? ['Ensure client grant is configured in Auth0 Dashboard for My Account API']
            : []),
        ],
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to test token:', error);

    return NextResponse.json(
      {
        error: 'Failed to test token',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});
