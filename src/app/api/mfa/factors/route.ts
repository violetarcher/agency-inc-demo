import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { getAvailableFactors } from '@/lib/my-account-api';

/**
 * GET /api/mfa/factors
 *
 * Lists all available MFA factors that can be enrolled by the current user.
 * These are the factor types available in the Auth0 tenant.
 *
 * Returns:
 * - 200: Array of available MFA factors
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

    console.log('📋 Fetching available MFA factors for user:', user.sub);

    // Get available factors from My Account API
    const factors = await getAvailableFactors();

    return NextResponse.json({
      success: true,
      factors,
      count: factors.length,
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch MFA factors:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch MFA factors',
        message: error.message || 'An unexpected error occurred',
        details: error.details,
      },
      { status: error.statusCode || 500 }
    );
  }
});
