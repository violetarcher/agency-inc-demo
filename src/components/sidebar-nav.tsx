// src/components/sidebar-nav.tsx - Clean production version
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FileText, 
  Settings,
  Monitor,
  Search
} from 'lucide-react';

interface SidebarNavProps {
  roles: string[];
}

export function SidebarNav({ roles }: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = roles && Array.isArray(roles) && roles.includes('Admin');

  return (
    <nav className="flex flex-col gap-2">
      {/* Public navigation items */}
      <Button 
        asChild 
        variant={pathname === '/' ? 'secondary' : 'ghost'} 
        className="w-full justify-start"
      >
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Link>
      </Button>
      
      <Button 
        asChild 
        variant={pathname === '/reports' ? 'secondary' : 'ghost'} 
        className="w-full justify-start"
      >
        <Link href="/reports">
          <FileText className="mr-2 h-4 w-4" />
          Reports
        </Link>
      </Button>
      
      <Button 
        asChild 
        variant={pathname === '/inspector' ? 'secondary' : 'ghost'} 
        className="w-full justify-start"
      >
        <Link href="/inspector">
          <Search className="mr-2 h-4 w-4" />
          Inspector
        </Link>
      </Button>
      
      {/* Admin-only navigation items */}
      {isAdmin && (
        <>
          <Button 
            asChild 
            variant={pathname === '/admin' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
          >
            <Link href="/admin">
              <Settings className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant={pathname === '/admin/sessions' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
          >
            <Link href="/admin/sessions">
              <Monitor className="mr-2 h-4 w-4" />
              Session Management
            </Link>
          </Button>
        </>
      )}
    </nav>
  );
}