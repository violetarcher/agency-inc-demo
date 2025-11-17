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
  amount: z.number().min(0, 'Amount must be positive'),
});

export const updateReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
});

// Access request schema
export const accessRequestSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

// Document management schemas
export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  content: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().min(0).optional(),
  parentId: z.string().nullable().optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  content: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  parentId: z.string().nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  parentId: z.string().nullable().optional(),
});

export const shareDocumentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  permission: z.enum(['viewer', 'owner']),
});

export const shareFolderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  permission: z.enum(['viewer', 'owner']),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export const addGroupMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});