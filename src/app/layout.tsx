import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMS - Asset Management System",
  description: "Centralised asset tracking, allocation, and lifecycle management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
