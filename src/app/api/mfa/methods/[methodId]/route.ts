import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import {
  getAuthenticationMethod,
  updateAuthenticationMethod,
  deleteAuthenticationMethod,
  MyAccountAPIError,
} from '@/lib/my-account-api';
import { mfaMethodIdSchema, updateMfaMethodSchema } from '@/lib/validations';
import {
  requireStepUpAuth,
  createStepUpResponse,
  StepUpRequiredError,
} from '@/lib/step-up-auth';

/**
 * GET /api/mfa/methods/[methodId]
 *
 * Retrieves details of a specific enrolled MFA method.
 *
 * Returns:
 * - 200: Authentication method details
 * - 404: Method not found
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { methodId: string } }
) {
  return withApiAuthRequired(async () => {
    try {
      const session = await getSession();
      const user = session?.user;

      if (!user?.sub) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Validate method ID
      const validation = mfaMethodIdSchema.safeParse({ methodId: params.methodId });
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.errors },
          { status: 400 }
        );
      }

      console.log('📋 Fetching MFA method:', params.methodId, 'for user:', user.sub);

      // Get authentication method via My Account API
      const method = await getAuthenticationMethod(params.methodId);

      return NextResponse.json({
        success: true,
        method,
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch MFA method:', error);

      // Handle My Account API errors
      if (error instanceof MyAccountAPIError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch MFA method',
            message: error.message,
            details: error.details,
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch MFA method',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PATCH /api/mfa/methods/[methodId]
 *
 * Updates a specific enrolled MFA method (e.g., rename, set as preferred).
 *
 * Request Body:
 * {
 *   name?: string,
 *   preferred?: boolean
 * }
 *
 * Returns:
 * - 200: Updated authentication method
 * - 400: Validation error
 * - 404: Method not found
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { methodId: string } }
) {
  return withApiAuthRequired(async () => {
    try {
      const session = await getSession();
      const user = session?.user;

      if (!user?.sub) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Validate method ID
      const methodValidation = mfaMethodIdSchema.safeParse({ methodId: params.methodId });
      if (!methodValidation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: methodValidation.error.errors },
          { status: 400 }
        );
      }

      // Parse and validate request body
      const body = await request.json();
      const validation = updateMfaMethodSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid update request',
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }

      const { name, preferred } = validation.data;

      console.log('✏️ Updating MFA method:', params.methodId, 'for user:', user.sub);

      // Build update object
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (preferred !== undefined) updates.preferred_authentication_method = preferred;

      // Update authentication method via My Account API
      const method = await updateAuthenticationMethod(params.methodId, updates);

      return NextResponse.json({
        success: true,
        message: 'MFA method updated successfully',
        method,
      });
    } catch (error: any) {
      console.error('❌ Failed to update MFA method:', error);

      // Handle My Account API errors
      if (error instanceof MyAccountAPIError) {
        return NextResponse.json(
          {
            error: 'Failed to update MFA method',
            message: error.message,
            details: error.details,
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to update MFA method',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/mfa/methods/[methodId]
 *
 * Removes a specific enrolled MFA factor.
 * Requires step-up authentication (MFA re-verification).
 *
 * Returns:
 * - 200: Method deleted successfully
 * - 403: Step-up authentication required
 * - 404: Method not found
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { methodId: string } }
) {
  return withApiAuthRequired(async () => {
    try {
      const session = await getSession();
      const user = session?.user;

      if (!user?.sub) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User not authenticated' },
          { status: 401 }
        );
      }

      // Validate method ID
      const validation = mfaMethodIdSchema.safeParse({ methodId: params.methodId });
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.errors },
          { status: 400 }
        );
      }

      // Require step-up authentication for removing MFA factors
      try {
        await requireStepUpAuth('/profile?tab=security');
      } catch (error) {
        if (error instanceof StepUpRequiredError) {
          return createStepUpResponse('/profile?tab=security');
        }
        throw error;
      }

      console.log('🗑️ Deleting MFA method:', params.methodId, 'for user:', user.sub);

      // Delete authentication method via My Account API
      await deleteAuthenticationMethod(params.methodId);

      return NextResponse.json({
        success: true,
        message: 'MFA method removed successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to delete MFA method:', error);

      // Handle My Account API errors
      if (error instanceof MyAccountAPIError) {
        return NextResponse.json(
          {
            error: 'Failed to delete MFA method',
            message: error.message,
            details: error.details,
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to delete MFA method',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  })(request);
}
