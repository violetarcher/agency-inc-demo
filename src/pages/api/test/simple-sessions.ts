// src/pages/api/test/simple-sessions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

async function getManagementToken(): Promise<string> {
  const response = await fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    })
  });
  
  const data = await response.json();
  return data.access_token;
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No session found' });
    }

    const userId = session.user.sub;
    console.log('Testing session API for user:', userId);

    // Test the session management API using direct HTTP call
    const managementToken = await getManagementToken();
    
    const response = await fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Session Management API is working!',
      userId: userId,
      sessionCount: data.sessions?.length || 0,
      sessions: data.sessions || [],
      fullResponse: data
    });
  } catch (error) {
    console.error('Session API test error:', error);
    
    // Check if it's an Enterprise plan limitation
    if (error.statusCode === 403 || error.statusCode === 404) {
      return res.status(403).json({ 
        error: 'Session Management API not available',
        message: 'This feature requires an Auth0 Enterprise plan',
        statusCode: error.statusCode,
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      statusCode: error.statusCode,
      details: error.response?.data || 'Unknown error'
    });
  }
});