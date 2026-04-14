import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession, getAccessToken } from '@auth0/nextjs-auth0';
import { enrollMfaFactorSchema } from '@/lib/validations';

/**
 * GET /api/mfa/methods
 *
 * Lists all enrolled authentication methods (MFA factors) for the current user via My Account API.
 *
 * Returns:
 * - 200: Array of enrolled authentication methods
 * - 401: Unauthorized
 * - 500: Server error
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

    // Get access token with My Account API audience
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available', message: 'Please re-authenticate' },
        { status: 401 }
      );
    }

    console.log('📋 Fetching enrolled MFA methods via My Account API for user:', user.sub);

    // Construct My Account API endpoint URL
    const myAccountDomain = process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', '');
    const myAccountUrl = `https://${myAccountDomain}/me/authentication-methods`;

    // Call My Account API
    const response = await fetch(myAccountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ My Account API error:', response.status, errorData);

      // If 404, My Account API might not be activated
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'My Account API not available',
            message: 'My Account API may not be activated in your Auth0 tenant',
            statusCode: 404,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch MFA methods',
          message: errorData.message || errorData.error || 'An unexpected error occurred',
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const methods = await response.json();

    return NextResponse.json({
      success: true,
      methods: Array.isArray(methods) ? methods : [],
      count: Array.isArray(methods) ? methods.length : 0,
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch MFA methods:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch MFA methods',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/mfa/methods
 *
 * Enrolls a new MFA factor for the current user via My Account API.
 * Note: Step-up authentication removed to allow first-factor enrollment.
 *
 * Request Body:
 * {
 *   type: 'sms' | 'phone' | 'email' | 'totp' | 'webauthn-roaming' | 'webauthn-platform',
 *   phoneNumber?: string,  // Required for SMS/phone
 *   email?: string,        // Required for email
 *   name?: string          // Optional display name
 * }
 *
 * Returns:
 * - 201: Enrolled authentication method
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Server error
 */
export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get access token with My Account API audience
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available', message: 'Please re-authenticate' },
        { status: 401 }
      );
    }

    // Step-up authentication removed - users need to be able to enroll their first MFA factor
    // without already having MFA enabled (chicken-and-egg problem)

    // Parse and validate request body
    const body = await request.json();
    const validation = enrollMfaFactorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid enrollment request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { type, phoneNumber } = validation.data;

    console.log('✨ Enrolling MFA factor via My Account API:', type, 'for user:', user.sub);

    // Create enrollment request
    const enrollmentRequest: any = { type };

    if (type === 'sms' || type === 'phone') {
      if (!phoneNumber) {
        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Phone number required for SMS/phone enrollment',
          },
          { status: 400 }
        );
      }
      enrollmentRequest.phone_number = phoneNumber;
    } else if (type === 'totp') {
      enrollmentRequest.authenticator_type = 'otp';
    } else {
      return NextResponse.json(
        {
          error: 'Not supported',
          message: `MFA type "${type}" not supported yet. Try SMS or TOTP.`,
        },
        { status: 400 }
      );
    }

    // Construct My Account API endpoint URL
    const myAccountDomain = process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', '');
    const myAccountUrl = `https://${myAccountDomain}/me/authentication-methods`;

    console.log('📤 Calling My Account API:', myAccountUrl);
    console.log('📦 Request body:', enrollmentRequest);

    // Call My Account API
    const response = await fetch(myAccountUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrollmentRequest),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ My Account API error:', response.status, errorData);

      return NextResponse.json(
        {
          error: 'Failed to enroll MFA factor',
          message: errorData.message || errorData.error || errorData.error_description || 'An unexpected error occurred',
          details: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const method = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: 'MFA factor enrolled successfully',
        method,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Failed to enroll MFA factor:', error);

    return NextResponse.json(
      {
        error: 'Failed to enroll MFA factor',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/mfa/methods
 *
 * Removes ALL enrolled MFA factors (MFA reset) via My Account API.
 * Note: Step-up authentication removed for consistency with enrollment.
 *
 * This is a destructive operation that should require user confirmation.
 *
 * Returns:
 * - 200: All methods deleted successfully
 * - 401: Unauthorized
 * - 500: Server error
 */
export const DELETE = withApiAuthRequired(async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get access token with My Account API audience
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available', message: 'Please re-authenticate' },
        { status: 401 }
      );
    }

    // Step-up authentication removed for consistency with enrollment
    // User confirmation still required in UI before calling this endpoint

    console.log('🗑️ Resetting all MFA factors via My Account API for user:', user.sub);

    // Construct My Account API endpoint URL
    const myAccountDomain = process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', '');
    const myAccountUrl = `https://${myAccountDomain}/me/authentication-methods`;

    // Get all methods first
    const getResponse = await fetch(myAccountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getResponse.ok) {
      const errorData = await getResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Failed to fetch methods for deletion:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to fetch MFA methods',
          message: errorData.message || 'Could not retrieve methods to delete',
        },
        { status: getResponse.status }
      );
    }

    const methods = await getResponse.json();

    // Delete each method
    for (const method of methods) {
      const deleteUrl = `${myAccountUrl}/${method.id}`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All MFA factors have been removed successfully',
    });
  } catch (error: any) {
    console.error('❌ Failed to reset MFA:', error);

    return NextResponse.json(
      {
        error: 'Failed to reset MFA',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});
