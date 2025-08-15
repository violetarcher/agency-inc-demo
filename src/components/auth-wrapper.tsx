// src/components/auth-wrapper.tsx
'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { SessionValidator } from './session-validator';
import { SessionEnforcer } from './session-enforcer';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SessionValidator />
      <SessionEnforcer />
      {children}
    </UserProvider>
  );
}