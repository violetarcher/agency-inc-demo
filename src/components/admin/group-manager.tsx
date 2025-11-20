// src/components/admin/group-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Group, GroupMember } from '@/types/groups';
import { Textarea } from '@/components/ui/textarea';

export function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [lookingUpUser, setLookingUpUser] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      } else {
        toast.error('Failed to load groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`);
      if (response.ok) {
        const data = await response.json();
        setGroupMembers(data.members);
      } else {
        toast.error('Failed to load group members');
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error('Failed to load group members');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups([data.group, ...groups]);
        setNewGroupName('');
        setNewGroupDescription('');
        setCreateDialogOpen(false);
        toast.success('Group created successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All members will be removed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== groupId));
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setGroupMembers([]);
        }
        toast.success('Group deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!selectedGroup) {
      toast.error('No group selected');
      return;
    }

    try {
      setLookingUpUser(true);

      // First, lookup the user by email
      const lookupResponse = await fetch(
        `/api/users/lookup?email=${encodeURIComponent(memberEmail)}`
      );

      if (!lookupResponse.ok) {
        toast.error('User not found in organization');
        return;
      }

      const userData = await lookupResponse.json();

      // Add the user to the group
      const addResponse = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user_id,
        }),
      });

      if (addResponse.ok) {
        await fetchGroupMembers(selectedGroup.id);
        setMemberEmail('');
        setAddMemberDialogOpen(false);
        toast.success('Member added to group');
      } else {
        const data = await addResponse.json();
        toast.error(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setLookingUpUser(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setGroupMembers(groupMembers.filter((m) => m.userId !== userId));
        toast.success('Member removed from group');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>Manage groups and their members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Groups</CardTitle>
              <CardDescription>Manage groups and their members</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Groups List */}
            <div>
              <h3 className="text-sm font-medium mb-3">All Groups ({groups.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No groups yet. Create one to get started.
                  </div>
                ) : (
                  groups.map((group) => (
                    <Card
                      key={group.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedGroup?.id === group.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{group.name}</h4>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {group.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Created {new Date(group.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Group Members */}
            <div>
              {selectedGroup ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">
                      Members of {selectedGroup.name} ({groupMembers.length})
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setAddMemberDialogOpen(true)}
                    >
                      Add Member
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {groupMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No members in this group yet.
                      </div>
                    ) : (
                      groupMembers.map((member) => (
                        <Card key={member.userId}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{member.name || member.email}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-destructive hover:text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center py-12 text-muted-foreground">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p>Select a group to view members</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to organize users and assign permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Engineering Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this group"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Enter the email address of an organization member to add them to this group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Member Email</Label>
              <Input
                id="memberEmail"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
              disabled={lookingUpUser}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={lookingUpUser}>
              {lookingUpUser ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
