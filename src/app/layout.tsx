import { UserProvider } from '@auth0/nextjs-auth0/client'; // 1. Import UserProvider
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import './globals.css';

export const metadata = {
  title: "Agency Inc. Dashboard",
  description: "Expense reporting for Agency Inc.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UserProvider> {/* 2. Add the UserProvider here */}
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen w-full">
              <Sidebar />
              <main className="flex-1 p-8">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}