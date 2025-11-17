// src/types/documents.ts
export interface Document {
  id: string;
  name: string;
  content?: string;
  mimeType?: string;
  size?: number;
  parentId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface DocumentPermission {
  documentId: string;
  userId: string;
  permission: 'viewer' | 'owner';
  grantedAt: string;
  grantedBy: string;
}

export interface FolderPermission {
  folderId: string;
  userId: string;
  permission: 'viewer' | 'owner';
  grantedAt: string;
  grantedBy: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  addedAt: string;
  addedBy: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentWithPermissions extends Document {
  canRead: boolean;
  canWrite: boolean;
  canShare: boolean;
  canChangeOwner: boolean;
}

export interface FolderWithPermissions extends Folder {
  canRead: boolean;
  canWrite: boolean;
  canCreateFile: boolean;
}
