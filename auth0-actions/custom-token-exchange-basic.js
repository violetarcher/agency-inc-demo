/**
 * Custom Token Exchange (CTE) Action for My Account API
 *
 * This Auth0 Action validates and processes token exchange requests for My Account API.
 * Based on: https://github.com/awhitmana0/a0-passkeyforms-demo
 *
 * CRITICAL: When using custom domains, this action MUST use the custom domain
 * in the token audience, NOT the canonical domain. Otherwise tokens will fail
 * validation with 401 "Invalid Token" errors.
 *
 * DEPLOYMENT:
 * 1. Create new Action in Auth0 Dashboard
 * 2. Select "Custom Token Exchange" trigger
 * 3. Paste this code
 * 4. Add Secret: CUSTOM_DOMAIN = "login.authskye.org" (your custom domain)
 * 5. Deploy
 * 6. Create Token Exchange Profile and link this action
 * 7. Link profile to your application
 *
 * IMPORTANT: Update the CUSTOM_DOMAIN secret to match your tenant's custom domain.
 */

exports.onExecuteCustomTokenExchange = async (event, api) => {
  // Validate the token exchange request
  if (event.transaction.protocol_params.subject_token_type !== "urn:myaccount:cte") {
    api.access.deny('subject_token_type_not_supported');
    return;
  }

  // CRITICAL: Use custom domain for My Account API audience
  // The audience MUST match the domain used in API calls
  const customDomain = event.secrets.CUSTOM_DOMAIN || 'login.authskye.org';
  const myAccountAudience = `https://${customDomain}/me/`;

  console.log('✅ Token exchange approved for My Account API', {
    audience: myAccountAudience,
    subject: event.transaction.protocol_params.subject_token
  });

  // Set the token audience to custom domain
  api.accessToken.setCustomClaim('aud', myAccountAudience);
};
