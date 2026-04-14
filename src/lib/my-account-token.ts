/**
 * My Account API Token Utilities
 *
 * Utilities for checking and obtaining access tokens with My Account API scopes.
 */

/**
 * Check if the access token has My Account API audience
 */
export function hasMyAccountAudience(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64UrlDecode = (str: string) => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      const missing = str.length % 4;
      if (missing) {
        str += '='.repeat(4 - missing);
      }
      return str;
    };

    const payload = JSON.parse(atob(base64UrlDecode(parts[1])));
    const audience = payload.aud;

    // Check if audience includes My Account API
    const myAccountAudience = process.env.NEXT_PUBLIC_MY_ACCOUNT_AUDIENCE || `${process.env.AUTH0_ISSUER_BASE_URL}/me/`;

    if (Array.isArray(audience)) {
      return audience.includes(myAccountAudience);
    }

    return audience === myAccountAudience;
  } catch (error) {
    console.error('Failed to check token audience:', error);
    return false;
  }
}

/**
 * Check if the access token has required My Account API scopes
 */
export function hasMyAccountScopes(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64UrlDecode = (str: string) => {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      const missing = str.length % 4;
      if (missing) {
        str += '='.repeat(4 - missing);
      }
      return str;
    };

    const payload = JSON.parse(atob(base64UrlDecode(parts[1])));
    const scope = payload.scope || '';
    const scopes = scope.split(' ');

    // Required scopes for MFA management (with 'me:' prefix)
    const requiredScopes = [
      'read:me:authentication_methods',
      'create:me:authentication_methods',
      'delete:me:authentication_methods',
    ];

    return requiredScopes.every(s => scopes.includes(s));
  } catch (error) {
    console.error('Failed to check token scopes:', error);
    return false;
  }
}

/**
 * Generate My Account API authentication URL
 */
export function getMyAccountAuthUrl(returnTo: string = '/profile?tab=security'): string {
  const baseUrl = window.location.origin;
  const myAccountScopes = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'read:me:authentication_methods',
    'create:me:authentication_methods',
    'update:me:authentication_methods',
    'delete:me:authentication_methods',
  ].join(' ');

  // Encode the scopes and return URL
  const params = new URLSearchParams({
    returnTo,
    scope: myAccountScopes,
    myaccount: 'true', // Flag to indicate My Account API request
  });

  return `/api/auth/login?${params.toString()}`;
}
