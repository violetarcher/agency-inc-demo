// src/lib/auth0-session-manager.ts
export interface Auth0Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  authenticated_at: string;
  authentication: {
    methods: Array<{
      name: string;
      timestamp: string;
      type?: string;
    }>;
  };
  idle_expires_at: string;
  expires_at: string;
  device?: {
    initial_user_agent?: string;
    initial_ip?: string;
    last_user_agent?: string;
    last_ip?: string;
    initial_asn?: string;
    last_asn?: string;
  };
  clients: Array<{
    client_id: string;
  }>;
  last_interacted_at: string;
}

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
  if (!response.ok) {
    throw new Error(`Failed to get management token: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

export class Auth0SessionManager {
  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<Auth0Session[]> {
    try {
      const token = await getManagementToken();
      
      const response = await fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get user sessions: ${data.message || 'Unknown error'}`);
      }
      
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  /**
   * Delete a specific session by session ID
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const token = await getManagementToken();
      
      const response = await fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Failed to delete session: ${data.message || 'Unknown error'}`);
      }
      
      console.log(`Session ${sessionId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Enforce single session limit for a user
   */
  static async enforceSingleSession(userId: string, currentSessionId?: string): Promise<{
    terminatedCount: number;
    remainingSession: Auth0Session | null;
  }> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      if (sessions.length <= 1) {
        return {
          terminatedCount: 0,
          remainingSession: sessions[0] || null
        };
      }

      // Sort sessions by creation date (newest first)
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      let sessionToKeep: Auth0Session;
      let sessionsToDelete: Auth0Session[];

      if (currentSessionId) {
        // Keep the specified current session
        sessionToKeep = sortedSessions.find(s => s.id === currentSessionId) || sortedSessions[0];
        sessionsToDelete = sortedSessions.filter(s => s.id !== sessionToKeep.id);
      } else {
        // Keep the newest session
        sessionToKeep = sortedSessions[0];
        sessionsToDelete = sortedSessions.slice(1);
      }

      // Delete old sessions
      const deletePromises = sessionsToDelete.map(session => 
        this.deleteSession(session.id)
      );
      await Promise.all(deletePromises);

      return {
        terminatedCount: sessionsToDelete.length,
        remainingSession: sessionToKeep
      };
    } catch (error) {
      console.error('Error enforcing single session:', error);
      throw error;
    }
  }
}