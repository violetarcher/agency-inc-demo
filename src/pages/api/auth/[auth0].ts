import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export default handleAuth({
  login: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const isStepUp = req.query.stepup === 'true';
      const hasInvitation = !!req.query.invitation; // Check if it's an invitation
      
      const authorizationParams: any = { // Use 'any' to allow adding properties
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access read:reports create:reports edit:reports delete:reports read:analytics',
      };

       if (req.query.login_hint) {
        authorizationParams.login_hint = req.query.login_hint;
      }

      if (isStepUp) {
        // Add MFA params for step-up
        authorizationParams.acr_values = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';
      } else if (!hasInvitation) {
        // Add prompt=login for standard logins, but NOT for invitations
        authorizationParams.prompt = 'login';
      }
      
      await handleLogin(req, res, { authorizationParams });
    } catch (error: any) {
      console.error("Login Handler Error:", error);
      res.status(error.status || 500).end(error.message);
    }
  },

  logout: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handleLogout(req, res, {
        returnTo: process.env.AUTH0_BASE_URL
      });
    } catch (error: any) {
      console.error("Logout Handler Error:", error);
      res.status(error.status || 500).end(error.message);
    }
  },

  callback: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handleCallback(req, res);
    } catch (error: any) {
      console.error("Callback Handler Error:", error);
      res.status(error.status || 500).end(error.message);
    }
  },

  onError: (req, res, error) => {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  },
});