import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export default handleAuth({
  login: handleLogin({
    authorizationParams: {
      // The audience is the identifier of your API in Auth0
      audience: process.env.AUTH0_AUDIENCE,
      // Add the permissions scope
      scope: 'openid profile email read:reports create:reports edit:reports delete:reports'
    }
  })
});