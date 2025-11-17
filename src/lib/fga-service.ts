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
 * @returns Promise<void>
 */
export async function writeTuple(tuple: FGATuple): Promise<void> {
  try {
    await fgaClient.write({
      writes: [tuple],
    });
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
 * @returns Promise<void>
 */
export async function deleteTuple(tuple: FGATuple): Promise<void> {
  try {
    await fgaClient.write({
      deletes: [tuple],
    });
  } catch (error) {
    console.error('FGA delete tuple error:', error);
    throw new Error('Failed to delete tuple');
  }
}

/**
 * Delete multiple relationship tuples from FGA
 * @param tuples - Array of relationship tuples to delete
 * @returns Promise<void>
 */
export async function deleteTuples(tuples: FGATuple[]): Promise<void> {
  try {
    await fgaClient.write({
      deletes: tuples,
    });
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
