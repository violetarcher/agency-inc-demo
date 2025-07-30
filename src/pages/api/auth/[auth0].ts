import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export default handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email read:reports create:reports edit:reports delete:reports',
      prompt: 'login', // Add this line
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  })
});