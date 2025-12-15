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

  useEffect(() => {
    // 1. Nếu đang loading thì không làm gì cả
    if (status === "loading") return;

    // 2. Nếu chưa đăng nhập (unauthenticated) -> Đá về trang Login custom
    if (status === "unauthenticated" || !session) {
      router.push("/auth/signin");
      return;
    }

    // 3. (Tuỳ chọn) Check thêm Role ở client nếu muốn chắc chắn
    // const roles = session?.roles || [];
    // if (!roles.includes("admin")) {
    //   router.push("/unauthorized");
    // }
  }, [status, session, router]);

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
