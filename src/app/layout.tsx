import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Geist
import "./globals.css";

// Initialize the Inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agency Inc. Dashboard",
  description: "Expense reporting for Agency Inc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font to the entire application */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}