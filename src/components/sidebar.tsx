import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { getSession } from '@auth0/nextjs-auth0';

export async function Sidebar() {
  const session = await getSession();
  const user = session?.user;

  const companyName = "Agency Inc";
  // A permanent, stable SVG icon URL
  const logoUrl = "https://raw.githubusercontent.com/feathericons/feather/master/icons/code.svg";

  return (
    <aside className="hidden w-64 flex-col border-r bg-gray-100/40 p-4 md:flex">
      <div className="mb-4 flex items-center gap-3">
        <Image
          src={logoUrl}
          alt={`${companyName} Logo`}
          width={32}
          height={32}
          // Style the SVG to be white for better visibility
          style={{ filter: 'invert(100%)' }}
        />
        <h2 className="text-xl font-bold">{companyName}</h2>
      </div>

      <nav className="flex flex-col gap-2">
        <Button asChild variant="secondary" className="justify-start">
          <Link href="/reports">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Reports
          </Link>
        </Button>
      </nav>

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
            <div className="flex flex-col">
               <span className="text-sm font-medium truncate" title={user.name}>
                {user.name}
               </span>
               <Button asChild variant="ghost" className="h-auto p-0 justify-start text-xs text-gray-500">
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