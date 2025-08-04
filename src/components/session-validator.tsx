// src/components/session-validator.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useRef } from 'react';

export function SessionValidator() {
  const { user, isLoading } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkCountRef = useRef(0);

  useEffect(() => {
    if (!user || isLoading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const validateSession = async () => {
      checkCountRef.current++;
      console.log(`🔍 Session validation #${checkCountRef.current} for user: ${user.sub}`);
      
      try {
        const response = await fetch('/api/auth/session/validate');
        const data = await response.json();
        
        console.log(`📊 Session validation result:`, data);
        
        if (!response.ok || data.valid === false) {
          console.log('🚨 Session invalid or revoked, logging out...');
          
          if (data.reason === 'session_revoked') {
            console.log('🔥 Session was revoked via back-channel logout');
          }
          
          // Store reason for logout
          localStorage.setItem('logout_reason', data.reason || 'session_invalid');
          
          // Force logout
          window.location.href = '/api/auth/logout';
          return;
        }
        
        console.log(`✅ Session valid for ${data.sessionId}`);
        
      } catch (error) {
        console.error('❌ Session validation error:', error);
        // Don't logout on network errors, just log them
      }
    };

    console.log('🚀 Starting session validation monitoring for user:', user.sub);
    
    // Check session every 5 seconds for immediate feedback
    intervalRef.current = setInterval(validateSession, 5000);
    
    // Initial check after 2 seconds
    setTimeout(validateSession, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Session validation monitoring stopped');
      }
    };
  }, [user, isLoading]);

  // Show session validator status
  if (user && !isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded shadow-lg text-sm z-50">
        🛡️ Session Validator Active
        <div className="text-xs opacity-75">Checking every 5s</div>
      </div>
    );
  }

  return null;
}