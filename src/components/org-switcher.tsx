'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  display_name: string;
  logo_url: string;
  isCurrent: boolean;
}

interface CurrentOrganization {
  id: string;
  name: string;
  logo: string;
}

interface OrgSwitcherProps {
  userEmail?: string;
}

export function OrgSwitcher({ userEmail }: OrgSwitcherProps = {}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<CurrentOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/user/organizations');

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const data = await response.json();
        console.log('🔍 Org Switcher Debug:', {
          organizations: data.organizations,
          organizationsLength: data.organizations?.length,
          currentOrg: data.currentOrganization
        });
        setOrganizations(data.organizations || []);
        setCurrentOrg(data.currentOrganization);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrgSwitch = async (orgId: string) => {
    try {
      setIsSwitching(true);
      setIsOpen(false);

      console.log('🔄 Switching to organization:', orgId);

      // Auth0 requires full re-authentication for organization switching
      // Refresh tokens are bound to the organization they were issued for
      const loginUrl = new URL('/api/auth/login', window.location.origin);
      loginUrl.searchParams.set('organization', orgId);
      loginUrl.searchParams.set('returnTo', window.location.pathname);

      // Pre-fill username with login_hint to speed up the process
      if (userEmail) {
        loginUrl.searchParams.set('login_hint', userEmail);
      }

      // Redirect to login - if user has SSO session, this will be quick
      window.location.href = loginUrl.toString();
    } catch (err) {
      console.error('❌ Error switching organization:', err);
      setError('Failed to switch organization');
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Loading organizations...</span>
      </div>
    );
  }

  console.log('🔍 Org Switcher Render Check:', {
    currentOrg,
    organizationsLength: organizations.length,
    shouldHide: !currentOrg || organizations.length <= 1
  });

  if (!currentOrg || organizations.length <= 1) {
    return null;
  }

  const logoUrl = currentOrg.logo || "https://auth0images.s3.us-east-2.amazonaws.com/Auth0+Official+Icons/auth0-identicons/icon-api.png";

  if (isSwitching) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm">Switching organization...</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isSwitching}
          className={cn(
            'w-full justify-between',
            isOpen && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src={logoUrl}
              alt={`${currentOrg.name} Logo`}
              width={16}
              height={16}
              className="h-4 w-4 rounded flex-shrink-0"
            />
            <span className="truncate text-sm">{currentOrg.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSwitch(org.id)}
            className={cn(
              'cursor-pointer',
              org.isCurrent && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-2 w-full">
              {org.logo_url && (
                <Image
                  src={org.logo_url}
                  alt={`${org.display_name} Logo`}
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded"
                />
              )}
              <span className="flex-1 truncate">
                {org.display_name || org.name}
              </span>
              {org.isCurrent && (
                <span className="text-xs text-muted-foreground">(Current)</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
