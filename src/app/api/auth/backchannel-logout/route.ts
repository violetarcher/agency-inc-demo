import { NextRequest } from 'next/server';
import { addRevokedSession } from '@/lib/session-revocation';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Backchannel logout received');
    
    // Try both JSON and form-encoded data
    let logout_token;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      logout_token = body.logout_token;
    } else {
      // Assume form-encoded data
      const formData = await request.formData();
      logout_token = formData.get('logout_token');
    }
    
    console.log('🔄 Logout token received:', logout_token ? 'present' : 'missing');

    if (!logout_token) {
      return Response.json({ error: 'Missing logout_token' }, { status: 400 });
    }

    // Extract session ID from logout token without verification
    try {
      const parts = logout_token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const sessionId = payload.sid;
        const userId = payload.sub;
        
        if (sessionId) {
          console.log(`🔄 Adding session to revoked list via backchannel: ${sessionId}`);
          addRevokedSession(sessionId);
        } else {
          console.log('🔄 No session ID found in logout token');
        }
      }
    } catch (decodeError) {
      // Continue anyway - we'll still return success
      console.warn('Error decoding logout token:', decodeError);
    }

    return Response.json({ 
      success: true,
      message: 'Logout processed'
    });

  } catch (error: any) {
    console.error('Backchannel logout error:', error);
    
    // Return success even on errors to avoid Auth0 retries
    return Response.json({ 
      success: true,
      message: 'Logout processed with errors',
      error: error.message
    });
  }
}