// src/lib/fga-service.ts
import fgaClient from './fga-client';

export type FGAObjectType = 'user' | 'group' | 'folder' | 'doc';
export type FGARelation =
  | 'owner'
  | 'viewer'
  | 'member'
  | 'parent'
  | 'can_read'
  | 'can_write'
  | 'can_share'
  | 'can_change_owner'
  | 'can_create_file';

export interface FGATuple {
  user: string;
  relation: FGARelation;
  object: string;
}

/**
 * Check if a user has a specific permission on an object
 * @param user - User identifier (e.g., "user:auth0|123")
 * @param relation - The relation/permission to check (e.g., "can_read", "can_write")
 * @param object - The object identifier (e.g., "doc:123", "folder:456")
 * @returns Promise<boolean> - True if user has the permission, false otherwise
 */
export async function checkPermission(
  user: string,
  relation: FGARelation,
  object: string
): Promise<boolean> {
  try {
    const response = await fgaClient.check({
      user,
      relation,
      object,
    });

    return response.allowed || false;
  } catch (error) {
    console.error('FGA check permission error:', error);
    throw new Error('Failed to check permission');
  }
}

/**
 * Write a relationship tuple to FGA
 * @param tuple - The relationship tuple to write
 * @returns Promise<FGATuple> - The tuple that was written
 */
export async function writeTuple(tuple: FGATuple): Promise<FGATuple> {
  try {
    await fgaClient.write({
      writes: [tuple],
    });
    return tuple;
  } catch (error) {
    console.error('FGA write tuple error:', error);
    throw new Error('Failed to write tuple');
  }
}

/**
 * Write multiple relationship tuples to FGA
 * @param tuples - Array of relationship tuples to write
 * @returns Promise<void>
 */
export async function writeTuples(tuples: FGATuple[]): Promise<void> {
  try {
    await fgaClient.write({
      writes: tuples,
    });
  } catch (error) {
    console.error('FGA write tuples error:', error);
    throw new Error('Failed to write tuples');
  }
}

/**
 * Delete a relationship tuple from FGA
 * @param tuple - The relationship tuple to delete
 * @returns Promise<FGATuple> - The tuple that was deleted
 */
export async function deleteTuple(tuple: FGATuple): Promise<FGATuple> {
  try {
    await fgaClient.write({
      deletes: [tuple],
    });
    return tuple;
  } catch (error) {
    console.error('FGA delete tuple error:', error);
    throw new Error('Failed to delete tuple');
  }
}

/**
 * Delete multiple relationship tuples from FGA
 * @param tuples - Array of relationship tuples to delete
 * @returns Promise<FGATuple[]> - The tuples that were deleted
 */
export async function deleteTuples(tuples: FGATuple[]): Promise<FGATuple[]> {
  try {
    await fgaClient.write({
      deletes: tuples,
    });
    return tuples;
  } catch (error) {
    console.error('FGA delete tuples error:', error);
    throw new Error('Failed to delete tuples');
  }
}

/**
 * List all objects of a specific type that a user has a relation to
 * @param user - User identifier (e.g., "user:auth0|123")
 * @param relation - The relation to check (e.g., "can_read")
 * @param objectType - The type of objects to list (e.g., "doc", "folder")
 * @returns Promise<string[]> - Array of object identifiers
 */
export async function listObjects(
  user: string,
  relation: FGARelation,
  objectType: FGAObjectType
): Promise<string[]> {
  try {
    const response = await fgaClient.listObjects({
      user,
      relation,
      type: objectType,
    });

    return response.objects || [];
  } catch (error) {
    console.error('FGA list objects error:', error);
    throw new Error('Failed to list objects');
  }
}

/**
 * Read all tuples for a specific object
 * @param object - The object identifier (e.g., "doc:123")
 * @returns Promise<FGATuple[]> - Array of tuples
 */
export async function readTuples(object: string): Promise<FGATuple[]> {
  try {
    const response = await fgaClient.read({
      object,
    });

    return (response.tuples || []).map((tuple: any) => ({
      user: tuple.key.user,
      relation: tuple.key.relation as FGARelation,
      object: tuple.key.object,
    }));
  } catch (error) {
    console.error('FGA read tuples error:', error);
    throw new Error('Failed to read tuples');
  }
}

/**
 * Helper function to format a user ID for FGA
 * @param userId - Auth0 user ID (e.g., "auth0|123")
 * @returns Formatted user string (e.g., "user:auth0|123")
 */
export function formatUserId(userId: string): string {
  return `user:${userId}`;
}

/**
 * Helper function to format a document ID for FGA
 * @param docId - Document ID
 * @returns Formatted document string (e.g., "doc:123")
 */
export function formatDocId(docId: string): string {
  return `doc:${docId}`;
}

/**
 * Helper function to format a folder ID for FGA
 * @param folderId - Folder ID
 * @returns Formatted folder string (e.g., "folder:123")
 */
export function formatFolderId(folderId: string): string {
  return `folder:${folderId}`;
}

/**
 * Helper function to format a group ID for FGA
 * @param groupId - Group ID
 * @returns Formatted group string (e.g., "group:123")
 */
export function formatGroupId(groupId: string): string {
  return `group:${groupId}`;
}

/**
 * Helper function to format a group member reference for FGA
 * Used when assigning groups to resources (e.g., folders)
 * @param groupId - Group ID
 * @returns Formatted group member string (e.g., "group:123#member")
 */
export function formatGroupMember(groupId: string): string {
  return `${formatGroupId(groupId)}#member`;
}

/**
 * Add a user to a group by writing a member tuple
 * @param userId - Auth0 user ID
 * @param groupId - Group ID
 * @returns Promise<FGATuple> - The tuple that was written
 */
export async function addUserToGroup(userId: string, groupId: string): Promise<FGATuple> {
  return await writeTuple({
    user: formatUserId(userId),
    relation: 'member',
    object: formatGroupId(groupId),
  });
}

/**
 * Remove a user from a group by deleting the member tuple
 * @param userId - Auth0 user ID
 * @param groupId - Group ID
 * @returns Promise<FGATuple> - The tuple that was deleted
 */
export async function removeUserFromGroup(userId: string, groupId: string): Promise<FGATuple> {
  return await deleteTuple({
    user: formatUserId(userId),
    relation: 'member',
    object: formatGroupId(groupId),
  });
}

/**
 * Assign a group to a folder (grants group members viewer access)
 * @param groupId - Group ID
 * @param folderId - Folder ID
 * @param permission - Permission level ('viewer' or 'owner')
 * @returns Promise<FGATuple> - The tuple that was written
 */
export async function assignGroupToFolder(
  groupId: string,
  folderId: string,
  permission: 'viewer' | 'owner' = 'viewer'
): Promise<FGATuple> {
  return await writeTuple({
    user: formatGroupMember(groupId),
    relation: permission,
    object: formatFolderId(folderId),
  });
}

/**
 * Remove a group's access to a folder
 * @param groupId - Group ID
 * @param folderId - Folder ID
 * @param permission - Permission level to revoke
 * @returns Promise<FGATuple> - The tuple that was deleted
 */
export async function removeGroupFromFolder(
  groupId: string,
  folderId: string,
  permission: 'viewer' | 'owner' = 'viewer'
): Promise<FGATuple> {
  return await deleteTuple({
    user: formatGroupMember(groupId),
    relation: permission,
    object: formatFolderId(folderId),
  });
}

/**
 * Get all members of a group by reading member tuples
 * @param groupId - Group ID
 * @returns Promise<string[]> - Array of user IDs
 */
export async function getGroupMembers(groupId: string): Promise<string[]> {
  try {
    const tuples = await readTuples(formatGroupId(groupId));
    return tuples
      .filter((tuple) => tuple.relation === 'member')
      .map((tuple) => tuple.user.replace('user:', ''));
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
  }
}
