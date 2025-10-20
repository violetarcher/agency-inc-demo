// src/app/layout.tsx - Using AuthWrapper
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthWrapper } from "@/components/auth-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";
import './globals.css';

export const metadata = {
  title: 'GolfClub Pro Dashboard',
  description: 'Golf Equipment Distribution Portal - B2B Sales Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <AuthWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex min-h-screen w-full">
                <Sidebar />
                <main className="flex-1 p-8">
                  {children}
                </main>
              </div>
              <Toaster />
            </ThemeProvider>
          </AuthWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}