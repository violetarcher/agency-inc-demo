import { z } from 'zod';

// Organization member schemas
export const memberIdSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
});

export const updateMemberRolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'At least one role is required').optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required').optional(),
}).refine(
  (data) => data.roles || data.roleIds,
  { message: 'Either roles or roleIds must be provided' }
);

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  roles: z.array(z.string()).optional(),
});

// Session management schemas
export const sessionIdSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const enforceSessionLimitSchema = z.object({
  maxSessions: z.number().min(1).max(10),
});

// Report schemas
export const reportIdSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
});

export const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
});

// Access request schema
export const accessRequestSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});