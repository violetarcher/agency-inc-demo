/**
 * Step-Up Authentication Utility
 *
 * Provides functions to enforce step-up authentication for sensitive operations.
 * Step-up auth requires users to re-authenticate with MFA before performing
 * high-risk actions like enrolling/removing MFA factors.
 *
 * How it works:
 * 1. Check if user's current session includes MFA verification
 * 2. If not, redirect user to re-authenticate with MFA
 * 3. After MFA completion, redirect back to the original action
 *
 * Reference: https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication
 */

import { getSession } from '@auth0/nextjs-auth0';

/**
 * ACR Values
 * Authentication Context Class Reference values used to specify authentication requirements
 */
export const ACR_VALUES = {
  // Standard MFA requirement
  MFA: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
  // Auth0-specific MFA requirement
  AUTH0_MFA: 'urn:okta:loa:2fa:any',
} as const;

/**
 * Step-Up Authentication Error
 */
export class StepUpRequiredError extends Error {
  constructor(
    message: string = 'Step-up authentication required',
    public redirectUrl: string
  ) {
    super(message);
    this.name = 'StepUpRequiredError';
  }
}

/**
 * Check if current session has MFA verification
 *
 * Examines the ID token's AMR (Authentication Methods References) claim
 * to determine if MFA was used in the current session.
 *
 * @returns true if MFA was completed, false otherwise
 */
export async function hasCompletedMFA(): Promise<boolean> {
  try {
    const session = await getSession();

    if (!session?.idToken) {
      return false;
    }

    // Decode ID token to check AMR claim
    const base64Payload = session.idToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

    // Check AMR (Authentication Methods References) claim
    const amr = payload.amr || [];

    // Check if MFA methods are present
    const mfaMethods = ['mfa', 'otp', 'sms', 'totp', 'push'];
    const hasMFA = amr.some((method: string) =>
      mfaMethods.includes(method.toLowerCase())
    );

    // Check ACR (Authentication Context Class Reference) claim
    const acr = payload.acr;
    const hasACR = acr === ACR_VALUES.MFA || acr === ACR_VALUES.AUTH0_MFA;

    console.log('🔐 MFA Check:', {
      hasMFA,
      hasACR,
      amr,
      acr,
      result: hasMFA || hasACR
    });

    return hasMFA || hasACR;
  } catch (error) {
    console.error('❌ Failed to check MFA status:', error);
    return false;
  }
}

/**
 * Require Step-Up Authentication
 *
 * Middleware function to enforce step-up authentication for sensitive operations.
 * If MFA is not present in the current session, throws StepUpRequiredError.
 *
 * Usage in API routes:
 * ```
 * await requireStepUpAuth('/profile?tab=security');
 * ```
 *
 * @param returnTo - URL to return to after step-up authentication
 * @throws StepUpRequiredError if MFA is not completed
 */
export async function requireStepUpAuth(returnTo: string = '/'): Promise<void> {
  const hasMFA = await hasCompletedMFA();

  if (!hasMFA) {
    const stepUpUrl = buildStepUpUrl(returnTo);
    throw new StepUpRequiredError(
      'This action requires step-up authentication',
      stepUpUrl
    );
  }
}

/**
 * Build Step-Up Authentication URL
 *
 * Creates a URL that redirects the user to re-authenticate with MFA,
 * then returns them to the specified location.
 *
 * @param returnTo - URL to return to after authentication
 * @returns Step-up authentication URL
 */
export function buildStepUpUrl(returnTo: string = '/'): string {
  const params = new URLSearchParams({
    stepup: 'true',
    returnTo,
  });

  return `/api/auth/login?${params.toString()}`;
}

/**
 * Get Step-Up Authentication Time
 *
 * Returns the timestamp when the user last completed MFA.
 * Useful for determining if step-up should be required based on time elapsed.
 *
 * @returns Timestamp of last MFA, or null if not available
 */
export async function getLastMFATime(): Promise<Date | null> {
  try {
    const session = await getSession();

    if (!session?.idToken) {
      return null;
    }

    const base64Payload = session.idToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

    // Check for auth_time claim (time of authentication)
    if (payload.auth_time) {
      return new Date(payload.auth_time * 1000);
    }

    // Fallback to token issued time
    if (payload.iat) {
      return new Date(payload.iat * 1000);
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to get last MFA time:', error);
    return null;
  }
}

/**
 * Should Require Step-Up
 *
 * Determines if step-up authentication should be required based on:
 * 1. Whether MFA was used in current session
 * 2. How long ago MFA was completed (configurable timeout)
 *
 * @param maxAgeMinutes - Maximum age in minutes before requiring re-authentication (default: 30)
 * @returns true if step-up should be required
 */
export async function shouldRequireStepUp(maxAgeMinutes: number = 30): Promise<boolean> {
  const hasMFA = await hasCompletedMFA();

  if (!hasMFA) {
    return true;
  }

  const lastMFATime = await getLastMFATime();

  if (!lastMFATime) {
    return true;
  }

  const now = new Date();
  const ageMinutes = (now.getTime() - lastMFATime.getTime()) / 1000 / 60;

  return ageMinutes > maxAgeMinutes;
}

/**
 * Handle Step-Up Required Response
 *
 * Creates a consistent API response when step-up authentication is required.
 * Includes the redirect URL for the client to follow.
 *
 * @param returnTo - URL to return to after authentication
 * @returns JSON response with step-up redirect information
 */
export function createStepUpResponse(returnTo: string = '/') {
  const stepUpUrl = buildStepUpUrl(returnTo);

  return Response.json(
    {
      error: 'Step-up authentication required',
      code: 'STEP_UP_REQUIRED',
      message: 'This action requires multi-factor authentication verification',
      requiresStepUp: true,
      redirectUrl: stepUpUrl,
    },
    { status: 403 }
  );
}

/**
 * With Step-Up Authentication
 *
 * Higher-order function that wraps API route handlers to enforce step-up auth.
 *
 * Usage:
 * ```
 * export const POST = withStepUpAuth(async (request) => {
 *   // Handler logic - only runs if MFA is verified
 * }, '/profile?tab=security');
 * ```
 *
 * @param handler - The API route handler function
 * @param returnTo - URL to return to after authentication
 * @returns Wrapped handler with step-up enforcement
 */
export function withStepUpAuth(
  handler: (request: Request) => Promise<Response>,
  returnTo: string = '/'
) {
  return async (request: Request): Promise<Response> => {
    try {
      await requireStepUpAuth(returnTo);
      return await handler(request);
    } catch (error) {
      if (error instanceof StepUpRequiredError) {
        return createStepUpResponse(returnTo);
      }
      throw error;
    }
  };
}
