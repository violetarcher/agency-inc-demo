"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MoreHorizontal } from 'lucide-react';

// Type definitions
type Member = { user_id: string; email: string; name: string; picture: string; roles: {id: string, name: string}[] };
type Role = { id: string; name: string; description: string; };
interface MemberManagerProps { initialMembers: any[]; availableRoles: Role[]; }

export function MemberManager({ initialMembers, availableRoles }: MemberManagerProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviteRole, setSelectedInviteRole] = useState(''); // Role for new invites
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [metadata, setMetadata] = useState({
    portal_user: false,
    read_only_access: false,
    read_write_access: false,
    system_configuration_privileges: false,
  });
  const router = useRouter();

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Email is required.");
      return;
    }

    // Build app_metadata from checkboxes if form is shown
    const app_metadata = showMetadataForm ? {
      ...(metadata.portal_user && { portal_user: true }),
      ...(metadata.read_only_access && { read_only_access: true }),
      ...(metadata.read_write_access && { read_write_access: true }),
      ...(metadata.system_configuration_privileges && { system_configuration_privileges: true }),
    } : undefined;

    const response = await fetch('/api/organization/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        ...(selectedInviteRole && { roles: [selectedInviteRole] }),
        ...(app_metadata && Object.keys(app_metadata).length > 0 && { app_metadata }),
      }),
    });

    if (response.ok) {
      toast.success("Invitation Sent!", { description: `An invitation has been sent to ${inviteEmail}.` });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setSelectedInviteRole('');
      setShowMetadataForm(false);
      setMetadata({
        portal_user: false,
        read_only_access: false,
        read_write_access: false,
        system_configuration_privileges: false,
      });
      router.refresh();
    } else {
      const error = await response.json();
      toast.error("Failed to send invitation", { description: error.message });
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) return;

    const response = await fetch(`/api/organization/members/${memberId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toast.success("Member Removed", { description: `${memberEmail} has been removed.` });
      setMembers(members.filter(m => m.user_id !== memberId));
    } else {
        const error = await response.json();
        toast.error("Failed to remove member", { description: error.message });
    }
  };

  const openAssignRoleDialog = (member: Member) => {
    setSelectedMember(member);
    setAssignedRoles(member.roles.map(role => role.id));
    setIsAssignRoleDialogOpen(true);
  };
  
  const handleRoleToggle = (roleId: string) => {
    setAssignedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleAssignRoles = async () => {
    if (!selectedMember) return;
    const response = await fetch(`/api/organization/members/${selectedMember.user_id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: assignedRoles }),
    });

    if (response.ok) {
        toast.success("Roles updated", { description: `Roles for ${selectedMember.email} have been updated.`});
        setIsAssignRoleDialogOpen(false);
        router.refresh();
    } else {
        const error = await response.json();
        toast.error("Failed to update roles", { description: error.message });
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsInviteDialogOpen(true)}>Add Member</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.user_id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {member.roles.map(role => role.name).join(', ')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openAssignRoleDialog(member)}>
                        Assign Roles
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRemove(member.user_id, member.email)}>
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Enter the email address for the new member. They will receive an email to join the organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Select value={selectedInviteRole} onValueChange={setSelectedInviteRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role (optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle for metadata form */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="show-metadata"
                checked={showMetadataForm}
                onCheckedChange={(checked) => setShowMetadataForm(checked as boolean)}
              />
              <label htmlFor="show-metadata" className="text-sm font-medium leading-none cursor-pointer">
                Add authorization metadata
              </label>
            </div>

            {/* Metadata form - only shown when toggled */}
            {showMetadataForm && (
              <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Authorization Attributes</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="portal-user"
                      checked={metadata.portal_user}
                      onCheckedChange={(checked) =>
                        setMetadata({ ...metadata, portal_user: checked as boolean })
                      }
                    />
                    <label htmlFor="portal-user" className="text-sm leading-none cursor-pointer">
                      Portal User
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="read-only"
                      checked={metadata.read_only_access}
                      onCheckedChange={(checked) =>
                        setMetadata({ ...metadata, read_only_access: checked as boolean })
                      }
                    />
                    <label htmlFor="read-only" className="text-sm leading-none cursor-pointer">
                      Read-only access
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="read-write"
                      checked={metadata.read_write_access}
                      onCheckedChange={(checked) =>
                        setMetadata({ ...metadata, read_write_access: checked as boolean })
                      }
                    />
                    <label htmlFor="read-write" className="text-sm leading-none cursor-pointer">
                      Read-write access
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sys-config"
                      checked={metadata.system_configuration_privileges}
                      onCheckedChange={(checked) =>
                        setMetadata({ ...metadata, system_configuration_privileges: checked as boolean })
                      }
                    />
                    <label htmlFor="sys-config" className="text-sm leading-none cursor-pointer">
                      System configuration privileges
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles for {selectedMember?.email}</DialogTitle>
            <DialogDescription>
              Select the roles to assign to this member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableRoles.map(role => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={role.id}
                  checked={assignedRoles.includes(role.id)}
                  onCheckedChange={() => handleRoleToggle(role.id)}
                />
                <label htmlFor={role.id} className="text-sm font-medium leading-none">
                  {role.name}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignRoles}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}