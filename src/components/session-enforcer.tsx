// src/components/session-enforcer.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useRef } from 'react';

export function SessionEnforcer() {
  const { user, isLoading } = useUser();
  const enforcementDoneRef = useRef(false);

  useEffect(() => {
    if (!user || isLoading) {
      return;
    }

    // Reset enforcement flag when user changes
    enforcementDoneRef.current = false;

    const enforceSessionLimit = async () => {
      if (!user || enforcementDoneRef.current) return;
      
      try {
        console.log('🔒 ENFORCER: Enforcing single session limit for user:', user.sub);
        
        const response = await fetch('/api/auth/session/enforce-my-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          console.error('🔒 ENFORCER: Failed to enforce session limit:', response.status);
          return;
        }
        
        const result = await response.json();
        
        if (result.success && result.terminatedCount > 0) {
          console.log(`🔒 ENFORCER: Terminated ${result.terminatedCount} other session(s)`);
        } else {
          console.log('🔒 ENFORCER: No other sessions to terminate');
        }
        
        enforcementDoneRef.current = true;
      } catch (error) {
        console.error('🔒 ENFORCER: Failed to enforce session limit:', error);
      }
    };

    console.log('🔒 ENFORCER: Starting session enforcement for user:', user.sub);
    
    // Enforce single session limit after a short delay
    setTimeout(enforceSessionLimit, 1000);

    return () => {
      enforcementDoneRef.current = false;
    };
  }, [user, isLoading]);

  return null; // This component has no UI
}