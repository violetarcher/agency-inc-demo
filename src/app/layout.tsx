import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner"; // 1. Update the import
import './globals.css';

// ... metadata ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
          <Toaster /> {/* 2. This Toaster is now from sonner */}
        </ThemeProvider>
      </body>
    </html>
  );
}