/**
 * Auth0 Action: MFA Challenge on Second Login (Non-Organization Users Only)
 *
 * Trigger: Post-Login
 *
 * Description:
 * This action challenges non-organization users with MFA on their second login.
 * - Skips users who are members of an Auth0 Organization
 * - Only triggers on the user's 2nd login (login_count === 2)
 * - Enrolls users in MFA if they haven't enrolled yet
 * - Challenges users who are already enrolled
 *
 * @param {Event} event - Details about the user and the context in which they are logging in
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login
 */
exports.onExecutePostLogin = async (event, api) => {
  // Skip if user is logging in as part of an organization
  if (event.organization) {
    console.log(`[MFA Action] Skipping - User is logging into organization: ${event.organization.name}`);
    return;
  }

  // Only proceed on the user's second login
  if (event.stats.logins_count !== 2) {
    console.log(`[MFA Action] Skipping - Login count is ${event.stats.logins_count}, not 2`);
    return;
  }

  console.log(`[MFA Action] Triggering MFA for user: ${event.user.email} (2nd login, non-org user)`);

  // Check if user has enrolled in MFA
  const enrolledFactors = event.user.multifactor || [];
  const hasEnrolledMFA = enrolledFactors.length > 0;

  if (!hasEnrolledMFA) {
    // User hasn't enrolled - prompt them to enroll
    console.log('[MFA Action] User not enrolled in MFA - prompting enrollment');

    // Challenge with OTP (One-Time Password) - this will prompt enrollment
    api.multifactor.enable('any', {
      allowRememberBrowser: false
    });

  } else {
    // User is already enrolled - challenge them
    console.log('[MFA Action] User already enrolled - challenging with MFA');

    api.multifactor.enable('any', {
      allowRememberBrowser: false
    });
  }
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect.
 * This is used if you need to handle the MFA callback.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login
 */
exports.onContinuePostLogin = async (event, api) => {
  // No additional logic needed on continue
};
