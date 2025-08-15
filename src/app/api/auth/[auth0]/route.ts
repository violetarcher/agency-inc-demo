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

      if (isStepUp) {
        // Add MFA params for step-up
        authorizationParams.acr_values = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';
      } else if (!hasInvitation && !isAccessRequest) {
        // Add prompt=login for standard logins, but NOT for invitations or access requests
        authorizationParams.prompt = 'login';
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
      return await handleCallback(req, ctx);
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