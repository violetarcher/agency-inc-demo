import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

interface RouteParams {
  params: {
    methodId: string;
  };
}

/**
 * POST /api/mfa/methods/[methodId]/verify
 *
 * Verifies and completes enrollment of an authentication method (e.g., TOTP).
 *
 * Request Body:
 * {
 *   code: string,          // 6-digit verification code from authenticator app
 *   auth_session?: string  // Optional session ID from enrollment response
 * }
 *
 * Returns:
 * - 200: Method verified and enrollment completed
 * - 400: Invalid code or verification failed
 * - 401: Unauthorized
 * - 500: Server error
 */
export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available', message: 'Please get My Account API token first' },
        { status: 401 }
      );
    }

    const { methodId } = params;
    const body = await request.json();
    const { code, auth_session } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Verification code is required' },
        { status: 400 }
      );
    }

    if (!auth_session) {
      return NextResponse.json(
        { error: 'Validation error', message: 'auth_session is required' },
        { status: 400 }
      );
    }

    console.log('✅ Verifying MFA method:', methodId, 'for user:', user.sub);

    // Construct My Account API verification endpoint
    const myAccountBaseUrl = process.env.AUTH0_ISSUER_BASE_URL!;
    const verifyUrl = `${myAccountBaseUrl}/me/v1/authentication-methods/${encodeURIComponent(methodId)}/verify`;

    console.log('📤 Calling verification endpoint:', verifyUrl);

    const verifyRequest = {
      otp_code: code,
      auth_session: auth_session
    };

    console.log('📦 Verification request:', verifyRequest);

    // Call My Account API verification endpoint
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyRequest),
    });

    console.log('📥 Verification response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Verification failed:', response.status, errorData);

      return NextResponse.json(
        {
          error: 'Verification failed',
          message: errorData.message || errorData.error || errorData.detail || 'Invalid verification code',
          details: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Verification successful:', result);

    return NextResponse.json({
      success: true,
      message: 'Authentication method verified successfully',
      method: result,
    });

  } catch (error: any) {
    console.error('❌ Failed to verify MFA method:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify MFA method',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});
