"use client";

import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Middleware đã handle authentication check rồi
  // Không cần redirect ở đây nữa để tránh conflict và redirect loop
  // useEffect(() => {
  //   if (status === "loading") return;
  //   if (status === "unauthenticated" || !session) {
  //     router.push("/auth/signin");
  //     return;
  //   }
  // }, [status, session, router]);

  // Hiển thị màn hình loading trong lúc đợi check session để tránh flash giao diện
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Navbar />
          <main className="p-4 flex-1 overflow-y-auto bg-background/95">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
