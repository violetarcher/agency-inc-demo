// src/lib/fga-client.ts
import { OpenFgaClient } from '@openfga/sdk';

if (!process.env.FGA_API_URL) {
  throw new Error('FGA_API_URL is not defined');
}

if (!process.env.FGA_STORE_ID) {
  throw new Error('FGA_STORE_ID is not defined');
}

// Build config object
const config: any = {
  apiUrl: process.env.FGA_API_URL,
  storeId: process.env.FGA_STORE_ID,
};

// Only add authorizationModelId if it's provided and not empty
if (process.env.FGA_MODEL_ID && process.env.FGA_MODEL_ID.trim() !== '') {
  config.authorizationModelId = process.env.FGA_MODEL_ID;
}

// Add credentials if provided
if (process.env.FGA_CLIENT_ID && process.env.FGA_CLIENT_SECRET) {
  config.credentials = {
    method: 'client_credentials' as const,
    config: {
      clientId: process.env.FGA_CLIENT_ID,
      clientSecret: process.env.FGA_CLIENT_SECRET,
      apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER,
      apiAudience: process.env.FGA_API_AUDIENCE,
    },
  };
}

console.log('Initializing FGA client with config:', {
  apiUrl: config.apiUrl,
  storeId: config.storeId,
  authorizationModelId: config.authorizationModelId,
  hasCredentials: !!config.credentials,
});

const fgaClient = new OpenFgaClient(config);

export default fgaClient;
