import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export const GET = handleAuth({
  login: async (req: NextRequest, ctx: any) => {
    try {
      const url = new URL(req.url);
      const isStepUp = url.searchParams.get('stepup') === 'true';
      const hasInvitation = !!url.searchParams.get('invitation');
      const isAccessRequest = url.searchParams.get('access_request') === 'true';
      
      
      const authorizationParams: any = {
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access read:reports create:reports edit:reports delete:reports read:analytics',
        acr_values: 'urn:okta:loa:2fa:any'
      };

      const loginHint = url.searchParams.get('login_hint');
      if (loginHint) {
        authorizationParams.login_hint = loginHint;
      }

      // Pass access request parameters to Auth0 Action
      if (isAccessRequest) {
        const requestedRole = url.searchParams.get('requested_role');
        const reason = url.searchParams.get('reason');
        
        if (requestedRole) {
          authorizationParams.requested_role = requestedRole;
        }
        if (reason) {
          authorizationParams.access_request_reason = reason;
        }
        authorizationParams.access_request = 'true';
      }

      // Handle prompt parameter from URL
      const promptParam = url.searchParams.get('prompt');
      
      if (isStepUp) {
        // Add MFA params for step-up
        authorizationParams.acr_values = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';
      } else if (promptParam) {
        // Use explicit prompt parameter if provided (e.g., prompt=none for silent auth)
        authorizationParams.prompt = promptParam;
      } else if (!hasInvitation && !isAccessRequest) {
        // Add prompt=login for standard logins, but NOT for invitations or access requests
        authorizationParams.prompt = 'login';
      }

      // For organization invitations, pass the invitation and organization parameters
      if (hasInvitation) {
        const invitation = url.searchParams.get('invitation');
        const organization = url.searchParams.get('organization');
        
        if (invitation) {
          authorizationParams.invitation = invitation;
        }
        if (organization) {
          authorizationParams.organization = organization;
        }
        
      }
      
      return await handleLogin(req, ctx, { authorizationParams });
    } catch (error: any) {
      console.error("Login Handler Error:", error);
      return Response.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  },

  logout: async (req: NextRequest, ctx: any) => {
    try {
      return await handleLogout(req, ctx, {
        returnTo: process.env.AUTH0_BASE_URL
      });
    } catch (error: any) {
      console.error("Logout Handler Error:", error);
      return Response.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  },

  callback: async (req: NextRequest, ctx: any) => {
    try {
      return await handleCallback(req, ctx, {
        afterCallback: async (_req: NextRequest, session: any) => {
          console.log('===== AUTH CALLBACK TRIGGERED =====');

          // Decode ID token to see claims
          if (session.idToken) {
            const base64Payload = session.idToken.split('.')[1];
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            console.log('ID Token Claims:', JSON.stringify(payload, null, 2));
            console.log('AMR Claim:', payload.amr || 'NOT FOUND');
          }

          console.log('===================================');

          return session;
        }
      });
    } catch (error: any) {
      console.error("Callback Handler Error:", error);
      return Response.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  }
});

export const POST = GET;