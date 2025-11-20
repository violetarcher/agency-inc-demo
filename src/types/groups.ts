// src/types/groups.ts

export interface Group {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  email: string;
  name?: string;
  addedAt: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}
