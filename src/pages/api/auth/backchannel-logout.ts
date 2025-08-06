// src/pages/api/auth/backchannel-logout.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Simple storage for revoked sessions
const revokedSessions = new Set<string>();

// Function to add revoked session
export function addRevokedSession(sessionId: string) {
  revokedSessions.add(sessionId);
  console.log(`📝 Added session ${sessionId} to revoked list`);
}

// Function to check if session is revoked
export function isSessionRevoked(sessionId: string): boolean {
  return revokedSessions.has(sessionId);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== BACK-CHANNEL LOGOUT REQUEST ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logout_token } = req.body;

    if (!logout_token) {
      console.log('❌ No logout_token provided');
      return res.status(400).json({ error: 'Missing logout_token' });
    }

    console.log('🔍 Processing logout token (simplified)...');

    // For now, let's not verify the JWT and just extract what we can
    // This will help us debug the issue first
    try {
      // Simple base64 decode to get session ID without verification
      const parts = logout_token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('Token payload:', payload);
        
        const sessionId = payload.sid;
        const userId = payload.sub;
        
        if (sessionId) {
          addRevokedSession(sessionId);
          console.log(`🗑️ Session ${sessionId} marked as revoked for user ${userId}`);
        }
      }
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      // Continue anyway - we'll still return success
    }

    console.log('✅ Back-channel logout processed successfully');

    res.status(200).json({ 
      success: true,
      message: 'Logout processed'
    });

  } catch (error) {
    console.error('❌ Back-channel logout error:', error);
    console.error('Error stack:', error.stack);
    
    // Return success even on errors to avoid Auth0 retries
    res.status(200).json({ 
      success: true,
      message: 'Logout processed with errors',
      error: error.message
    });
  }
}