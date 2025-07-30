import { getSession } from '@auth0/nextjs-auth0';
import { SidebarNav } from './sidebar-nav'; // Import the new component
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export async function Sidebar() {
  const session = await getSession();
  const user = session?.user;
  
  const roles = user?.['https://agency-inc-demo.com/roles'] || [];
  const companyName = "Agency Inc";
  const logoUrl = "https://auth0images.s3.us-east-2.amazonaws.com/Auth0+Official+Icons/auth0-identicons/icon-api.png";

  return (
    <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
      <div className="mb-4 flex items-center gap-3">
        <Image
          src={logoUrl}
          alt={`${companyName} Logo`}
          width={32}
          height={32}
          className="rounded-md"
        />
        <h2 className="text-xl font-bold">{companyName}</h2>
      </div>

      {/* Use the client component for navigation and pass roles to it */}
      <SidebarNav roles={roles} />
      
      <div className="mt-auto">
        {user ? (
          <div className="flex items-center gap-3">
            <Image
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex flex-col min-w-0">
               <span className="text-sm font-medium truncate" title={user.name}>
                {user.name}
               </span>
               <Button asChild variant="ghost" className="h-auto p-0 justify-start text-xs text-muted-foreground">
                <Link href="/api/auth/logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/api/auth/login?returnTo=/reports">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
