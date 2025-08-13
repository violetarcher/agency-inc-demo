'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useRef, useCallback } from 'react';

export function SessionMonitor() {
  const { user, isLoading } = useUser();
  const enforcementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  const enforceSessionLimit = useCallback(async () => {
    if (!user) return;

    try {
      // Get current session ID from Auth0 (you might need to extract this from the ID token)
      const currentSessionId = currentSessionIdRef.current;

      const response = await fetch('/api/auth/session/enforce-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentSessionId
        })
      });

      const result = await response.json();
      
      if (result.terminatedCount > 0) {
        console.log(`Terminated ${result.terminatedCount} other session(s)`);
      }
    } catch (error) {
      console.error('Failed to enforce session limit:', error);
    }
  }, [user]);

  const checkSessionStatus = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/session/list');
      const result = await response.json();
      
      if (result.success && result.sessions.length === 0) {
        // No sessions found - user might have been logged out elsewhere
        console.log('No active sessions found, redirecting to login');
        window.location.href = '/api/auth/logout';
      }
    } catch (error) {
      console.error('Failed to check session status:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || isLoading) return;

    // Extract session ID from the user object if available
    // This might be in the token or you might need to get it differently
    const sessionId = (user as any).sid || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentSessionIdRef.current = sessionId;

    // Enforce session limit immediately on mount
    enforceSessionLimit();

    // Check session status periodically
    enforcementIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 2 * 60 * 1000); // Check every 2 minutes

    return () => {
      if (enforcementIntervalRef.current) {
        clearInterval(enforcementIntervalRef.current);
      }
    };
  }, [user, isLoading, enforceSessionLimit, checkSessionStatus]);

  // Listen for focus events to check session when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        checkSessionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, checkSessionStatus]);

  return null;
}