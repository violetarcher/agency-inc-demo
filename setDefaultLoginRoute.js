const { ManagementClient } = require('auth0');

// Load your .env.local file to get the credentials
require('dotenv').config({ path: './.env.local' });

// Check if required environment variables are set
if (!process.env.AUTH0_MGMT_DOMAIN || !process.env.AUTH0_MGMT_CLIENT_ID || !process.env.AUTH0_MGMT_CLIENT_SECRET) {
    console.error("Error: Please make sure AUTH0_MGMT_DOMAIN, AUTH0_MGMT_CLIENT_ID, and AUTH0_MGMT_CLIENT_SECRET are set in your .env.local file.");
    process.exit(1);
}

const managementClient = new ManagementClient({
  domain: process.env.AUTH0_MGMT_DOMAIN,
  clientId: process.env.AUTH0_MGMT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET,
});

const tenantSettings = {
  // This is the setting we need to update
  default_login_uri: process.env.AUTH0_BASE_URL
};

console.log(`Updating tenant default login URI to: ${tenantSettings.default_login_uri}`);

managementClient.tenants.updateSettings(tenantSettings)
  .then(response => {
    console.log("Successfully updated tenant settings!");
    console.log(response.data);
  })
  .catch(err => {
    console.error("Failed to update tenant settings:", err.message);
  });