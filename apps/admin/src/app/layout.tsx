import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SessionAuthProvider from "@/components/SessionAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Quản trị hệ thống",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const session = await getServerSession(authOptions);
  console.log(session);

  const roles = session?.user?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("Admin");

  const shouldShowSidebar = !!session && isAdmin;

  return (
    <SessionAuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {shouldShowSidebar ? (
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <main className="w-full bg-gray-50 dark:bg-zinc-900 min-h-screen flex flex-col">
                  <Navbar />
                  <div className="flex-1 p-4">{children}</div>
                </main>
              </SidebarProvider>
            ) : (
              <main className="w-full h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
                {children}
              </main>
            )}
          </ThemeProvider>
        </body>
      </html>
    </SessionAuthProvider>
  );
}
