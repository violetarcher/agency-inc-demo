'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ShieldCheck, FileJson } from 'lucide-react';

export function SidebarNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      <Button
        asChild
        variant={pathname === '/reports' ? 'secondary' : 'ghost'}
        className="justify-start"
      >
        <Link href="/reports">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Reports
        </Link>
      </Button>

      {roles.includes('Admin') && (
        <Button
          asChild
          variant={pathname === '/admin' ? 'secondary' : 'ghost'}
          className="justify-start"
        >
          <Link href="/admin">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Link>
        </Button>
      )}

      <Button
        asChild
        variant={pathname === '/inspector' ? 'secondary' : 'ghost'}
        className="justify-start"
      >
        <Link href="/inspector">
          <FileJson className="mr-2 h-4 w-4" />
          Token Inspector
        </Link>
      </Button>
    </nav>
  );
}