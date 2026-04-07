/**
 * My Account API Service
 *
 * This service provides methods to interact with the Auth0 My Account API,
 * which enables users to self-manage their authentication methods (MFA factors).
 *
 * Documentation: https://auth0.com/docs/manage-users/my-account-api
 * API Reference: https://auth0.com/docs/api/myaccount
 *
 * Key Features:
 * - List enrolled authentication methods
 * - Enroll new MFA factors
 * - Remove authentication methods
 * - Get available factors for enrollment
 *
 * Rate Limit: 25 requests per second (tenant level)
 */

import { getAccessToken } from '@auth0/nextjs-auth0';

/**
 * My Account API Configuration
 */
const MY_ACCOUNT_API_AUDIENCE = `https://${process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')}/me/`;
const MY_ACCOUNT_API_BASE_URL = `https://${process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '')}/me`;

/**
 * Authentication Method Types
 * Supported MFA factor types in Auth0
 */
export type AuthenticationMethodType =
  | 'phone'      // SMS/Voice OTP
  | 'sms'        // SMS OTP (legacy)
  | 'email'      // Email OTP
  | 'totp'       // Time-based OTP (Authenticator apps)
  | 'webauthn-roaming'    // Security keys (YubiKey, etc.)
  | 'webauthn-platform'   // Platform authenticators (Face ID, Touch ID)
  | 'push-notification';  // Push notifications (Guardian)

/**
 * Authentication Method Interface
 * Represents an enrolled MFA factor
 */
export interface AuthenticationMethod {
  id: string;
  type: AuthenticationMethodType;
  name?: string;
  confirmed: boolean;
  created_at: string;
  last_auth_at?: string;
  phone_number?: string;
  email?: string;
  authenticator_type?: string;
  totp_secret?: string;
  recovery_codes?: string[];
  preferred_authentication_method?: boolean;
}

/**
 * MFA Factor Interface
 * Represents an available factor type for enrollment
 */
export interface MFAFactor {
  type: AuthenticationMethodType;
  enabled: boolean;
  name: string;
  description: string;
}

/**
 * Enrollment Request Interface
 */
export interface EnrollmentRequest {
  type: AuthenticationMethodType;
  name?: string;
  phone_number?: string;
  email?: string;
  authenticator_type?: 'otp' | 'oob';
}

/**
 * My Account API Error
 */
export class MyAccountAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MyAccountAPIError';
  }
}

/**
 * Get Access Token for My Account API
 *
 * Retrieves an access token with the My Account API audience and scopes.
 * Note: This requires the application to be configured with My Account API scopes.
 */
async function getMyAccountAccessToken(): Promise<string> {
  try {
    // Attempt to get access token with My Account API audience
    // Note: This will only work if the user's session includes My Account API scopes
    const result = await getAccessToken({
      authorizationParams: {
        audience: MY_ACCOUNT_API_AUDIENCE,
        scope: 'read:me:authentication_methods create:me:authentication_methods update:me:authentication_methods delete:me:authentication_methods',
      }
    });

    if (!result.accessToken) {
      throw new MyAccountAPIError(
        'Failed to obtain My Account API access token',
        401,
        'No access token returned'
      );
    }

    return result.accessToken;
  } catch (error: any) {
    console.error('❌ Failed to get My Account API access token:', error);
    throw new MyAccountAPIError(
      'Authentication failed for My Account API',
      401,
      error.message
    );
  }
}

/**
 * Make authenticated request to My Account API
 */
async function myAccountAPIRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getMyAccountAccessToken();

  const url = `${MY_ACCOUNT_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle rate limiting
  if (response.status === 429) {
    throw new MyAccountAPIError(
      'Rate limit exceeded. Please try again later.',
      429,
      'Too many requests to My Account API (25 req/sec limit)'
    );
  }

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    throw new MyAccountAPIError(
      'Unauthorized to access My Account API',
      response.status,
      'Missing or invalid access token'
    );
  }

  // Parse response
  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new MyAccountAPIError(
      data?.message || `My Account API request failed: ${response.statusText}`,
      response.status,
      data
    );
  }

  return data as T;
}

/**
 * List Authentication Methods
 *
 * Retrieves all enrolled authentication methods for the current user.
 *
 * @returns Array of authentication methods
 */
export async function listAuthenticationMethods(): Promise<AuthenticationMethod[]> {
  try {
    const methods = await myAccountAPIRequest<AuthenticationMethod[]>('/authentication-methods', {
      method: 'GET',
    });

    console.log('✅ Listed authentication methods:', methods?.length || 0);
    return methods || [];
  } catch (error) {
    console.error('❌ Failed to list authentication methods:', error);
    throw error;
  }
}

/**
 * Get Authentication Method
 *
 * Retrieves a specific authentication method by ID.
 *
 * @param methodId - The authentication method ID
 * @returns Authentication method details
 */
export async function getAuthenticationMethod(methodId: string): Promise<AuthenticationMethod> {
  try {
    const method = await myAccountAPIRequest<AuthenticationMethod>(
      `/authentication-methods/${methodId}`,
      { method: 'GET' }
    );

    console.log('✅ Retrieved authentication method:', methodId);
    return method;
  } catch (error) {
    console.error('❌ Failed to get authentication method:', error);
    throw error;
  }
}

/**
 * Create Authentication Method
 *
 * Enrolls a new authentication method (MFA factor) for the current user.
 * Note: Some factors may require additional steps (e.g., TOTP QR code scanning).
 *
 * @param enrollment - Enrollment request data
 * @returns Created authentication method
 */
export async function createAuthenticationMethod(
  enrollment: EnrollmentRequest
): Promise<AuthenticationMethod> {
  try {
    const method = await myAccountAPIRequest<AuthenticationMethod>(
      '/authentication-methods',
      {
        method: 'POST',
        body: JSON.stringify(enrollment),
      }
    );

    console.log('✅ Created authentication method:', method.type, method.id);
    return method;
  } catch (error) {
    console.error('❌ Failed to create authentication method:', error);
    throw error;
  }
}

/**
 * Update Authentication Method
 *
 * Updates an existing authentication method (e.g., rename, set as preferred).
 *
 * @param methodId - The authentication method ID
 * @param updates - Fields to update
 * @returns Updated authentication method
 */
export async function updateAuthenticationMethod(
  methodId: string,
  updates: { name?: string; preferred_authentication_method?: boolean }
): Promise<AuthenticationMethod> {
  try {
    const method = await myAccountAPIRequest<AuthenticationMethod>(
      `/authentication-methods/${methodId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );

    console.log('✅ Updated authentication method:', methodId);
    return method;
  } catch (error) {
    console.error('❌ Failed to update authentication method:', error);
    throw error;
  }
}

/**
 * Delete Authentication Method
 *
 * Removes a specific authentication method from the user's account.
 *
 * @param methodId - The authentication method ID to delete
 */
export async function deleteAuthenticationMethod(methodId: string): Promise<void> {
  try {
    await myAccountAPIRequest<void>(
      `/authentication-methods/${methodId}`,
      { method: 'DELETE' }
    );

    console.log('✅ Deleted authentication method:', methodId);
  } catch (error) {
    console.error('❌ Failed to delete authentication method:', error);
    throw error;
  }
}

/**
 * Delete All Authentication Methods
 *
 * Removes all authentication methods from the user's account (MFA reset).
 * This is a destructive operation and should require confirmation.
 */
export async function deleteAllAuthenticationMethods(): Promise<void> {
  try {
    await myAccountAPIRequest<void>(
      '/authentication-methods',
      { method: 'DELETE' }
    );

    console.log('✅ Deleted all authentication methods');
  } catch (error) {
    console.error('❌ Failed to delete all authentication methods:', error);
    throw error;
  }
}

/**
 * Get Available Factors
 *
 * Retrieves the list of MFA factors available for enrollment.
 * Note: This may not be a direct My Account API endpoint; may need to be derived.
 *
 * @returns Array of available MFA factors
 */
export async function getAvailableFactors(): Promise<MFAFactor[]> {
  // Note: The My Account API may have a /factors endpoint, but if not,
  // we return a static list of commonly available factors
  // This should be updated based on actual API capabilities

  return [
    {
      type: 'sms',
      enabled: true,
      name: 'SMS',
      description: 'Receive verification codes via text message',
    },
    {
      type: 'totp',
      enabled: true,
      name: 'Authenticator App',
      description: 'Use an authenticator app like Google Authenticator or Authy',
    },
    {
      type: 'webauthn-roaming',
      enabled: true,
      name: 'Security Key',
      description: 'Use a hardware security key like YubiKey',
    },
    {
      type: 'webauthn-platform',
      enabled: true,
      name: 'Biometric',
      description: 'Use Face ID, Touch ID, or Windows Hello',
    },
    {
      type: 'email',
      enabled: true,
      name: 'Email',
      description: 'Receive verification codes via email',
    },
  ];
}
