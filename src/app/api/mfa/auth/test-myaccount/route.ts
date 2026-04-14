import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getAccessToken, getSession } from '@auth0/nextjs-auth0';

/**
 * GET /api/mfa/auth/test-myaccount
 *
 * Test endpoint to try calling My Account API directly to list authentication methods.
 * This helps diagnose 404 errors and other issues when calling My Account API.
 *
 * Returns:
 * - Success response with authentication methods if My Account API works
 * - Detailed error information if it fails
 */
export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the access token
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    console.log('🧪 Testing My Account API call...');
    console.log('   User:', user.sub);
    console.log('   Issuer:', process.env.AUTH0_ISSUER_BASE_URL);

    // Construct My Account API endpoint URL
    const myAccountDomain = process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', '');
    const myAccountUrl = `https://${myAccountDomain}/me/authentication-methods`;

    console.log('   Calling:', myAccountUrl);

    // Call My Account API
    const response = await fetch(myAccountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response body
    const responseText = await response.text();
    console.log('   Response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        test: 'My Account API - List Authentication Methods',
        endpoint: myAccountUrl,
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        recommendations: [
          response.status === 404
            ? 'My Account API may not be activated in your Auth0 tenant'
            : '',
          response.status === 401 || response.status === 403
            ? 'Token may not have My Account API audience or scopes'
            : '',
          response.status === 401 || response.status === 403
            ? 'Ensure client grant is configured for My Account API'
            : '',
        ].filter(Boolean),
      });
    }

    return NextResponse.json({
      success: true,
      test: 'My Account API - List Authentication Methods',
      endpoint: myAccountUrl,
      status: response.status,
      data: responseData,
      message: 'Successfully called My Account API!',
    });
  } catch (error: any) {
    console.error('❌ Failed to test My Account API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test My Account API',
        message: error.message || 'An unexpected error occurred',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
});
