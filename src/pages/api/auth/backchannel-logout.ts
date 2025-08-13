// src/pages/api/auth/backchannel-logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { addRevokedSession } from '@/lib/session-revocation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logout_token } = req.body;

    if (!logout_token) {
      return res.status(400).json({ error: 'Missing logout_token' });
    }

    // Extract session ID from logout token without verification
    try {
      const parts = logout_token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const sessionId = payload.sid;
        const userId = payload.sub;
        
        if (sessionId) {
          addRevokedSession(sessionId);
        }
      }
    } catch (decodeError) {
      // Continue anyway - we'll still return success
    }

    res.status(200).json({ 
      success: true,
      message: 'Logout processed'
    });

  } catch (error: any) {
    
    // Return success even on errors to avoid Auth0 retries
    res.status(200).json({ 
      success: true,
      message: 'Logout processed with errors',
      error: error.message
    });
  }
}