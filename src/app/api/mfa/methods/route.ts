import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import {
  listAuthenticationMethods,
  createAuthenticationMethod,
  deleteAllAuthenticationMethods,
  MyAccountAPIError,
} from '@/lib/my-account-api';
import { enrollMfaFactorSchema } from '@/lib/validations';
import {
  requireStepUpAuth,
  createStepUpResponse,
  StepUpRequiredError,
} from '@/lib/step-up-auth';

/**
 * GET /api/mfa/methods
 *
 * Lists all enrolled authentication methods (MFA factors) for the current user.
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

    console.log('📋 Fetching enrolled MFA methods for user:', user.sub);

    // List all enrolled authentication methods
    const methods = await listAuthenticationMethods();

    return NextResponse.json({
      success: true,
      methods,
      count: methods.length,
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch MFA methods:', error);

    // Handle My Account API errors
    if (error instanceof MyAccountAPIError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch MFA methods',
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

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
 * Enrolls a new MFA factor for the current user.
 * Requires step-up authentication (MFA re-verification).
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
 * - 403: Step-up authentication required
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

    // Require step-up authentication for enrolling new MFA factors
    try {
      await requireStepUpAuth('/profile?tab=security');
    } catch (error) {
      if (error instanceof StepUpRequiredError) {
        return createStepUpResponse('/profile?tab=security');
      }
      throw error;
    }

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

    const { type, phoneNumber, email, name } = validation.data;

    console.log('✨ Enrolling MFA factor:', type, 'for user:', user.sub);

    // Create enrollment request
    const enrollmentRequest: any = { type };

    if (phoneNumber) {
      enrollmentRequest.phone_number = phoneNumber;
    }

    if (email) {
      enrollmentRequest.email = email;
    }

    if (name) {
      enrollmentRequest.name = name;
    }

    // Create authentication method via My Account API
    const method = await createAuthenticationMethod(enrollmentRequest);

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

    // Handle My Account API errors
    if (error instanceof MyAccountAPIError) {
      return NextResponse.json(
        {
          error: 'Failed to enroll MFA factor',
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

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
 * Removes ALL enrolled MFA factors (MFA reset).
 * Requires step-up authentication (MFA re-verification).
 *
 * This is a destructive operation that should require user confirmation.
 *
 * Returns:
 * - 200: All methods deleted successfully
 * - 403: Step-up authentication required
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

    // Require step-up authentication for removing all MFA factors
    try {
      await requireStepUpAuth('/profile?tab=security');
    } catch (error) {
      if (error instanceof StepUpRequiredError) {
        return createStepUpResponse('/profile?tab=security');
      }
      throw error;
    }

    console.log('🗑️ Resetting all MFA factors for user:', user.sub);

    // Delete all authentication methods via My Account API
    await deleteAllAuthenticationMethods();

    return NextResponse.json({
      success: true,
      message: 'All MFA factors have been removed successfully',
    });
  } catch (error: any) {
    console.error('❌ Failed to reset MFA:', error);

    // Handle My Account API errors
    if (error instanceof MyAccountAPIError) {
      return NextResponse.json(
        {
          error: 'Failed to reset MFA',
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to reset MFA',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});
