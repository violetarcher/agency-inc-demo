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
  children: React.ReactNode; // Corrected line
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
        </ThemeProvider>
      </body>
    </html>
  );
}