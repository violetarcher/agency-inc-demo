// src/lib/api-middleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import { getUserRoles, getUserPermissions, hasRole, hasPermission } from './auth-utils';

export interface AuthenticatedRequest extends NextApiRequest {
  user: any;
}

type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

interface ProtectionOptions {
  requiredRole?: string;
  requiredPermission?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL specified roles/permissions
}

export function withAuth(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession(req, res);
      
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      (req as AuthenticatedRequest).user = session.user;
      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function withRoleProtection(options: ProtectionOptions, handler: ApiHandler) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { user } = req;
    const userRoles = getUserRoles(user);
    const userPermissions = getUserPermissions(user);

    // Check required role
    if (options.requiredRole && !hasRole(user, options.requiredRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { role: options.requiredRole }
      });
    }

    // Check required permission
    if (options.requiredPermission && !hasPermission(user, options.requiredPermission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { permission: options.requiredPermission }
      });
    }

    // Check multiple roles
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const hasRequiredRoles = options.requireAll
        ? options.requiredRoles.every(role => userRoles.includes(role))
        : options.requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRoles) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: { 
            roles: options.requiredRoles,
            requireAll: options.requireAll 
          }
        });
      }
    }

    // Check multiple permissions
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasRequiredPermissions = options.requireAll
        ? options.requiredPermissions.every(permission => userPermissions.includes(permission))
        : options.requiredPermissions.some(permission => userPermissions.includes(permission));

      if (!hasRequiredPermissions) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: { 
            permissions: options.requiredPermissions,
            requireAll: options.requireAll 
          }
        });
      }
    }

    return handler(req, res);
  });
}

// Specific middleware for analytics access
export function withAnalyticsAccess(handler: ApiHandler) {
  return withRoleProtection(
    {
      requiredRole: 'Data Analyst',
      requiredPermission: 'read:analytics',
      requireAll: true
    },
    handler
  );
}