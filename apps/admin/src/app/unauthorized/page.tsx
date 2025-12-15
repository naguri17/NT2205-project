"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { handleFederatedLogout } from "@/lib/auth";

export default function UnauthorizedPage() {
  const { data } = useSession();
  console.log(data);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-4xl font-bold text-destructive">
        403 - Access Denied
      </h1>
      <p className="text-muted-foreground">
        Tài khoản của bạn không có quyền truy cập vào Admin Dashboard.
      </p>
      <Button onClick={() => handleFederatedLogout(data)} variant="destructive">
        Đăng xuất / Đổi tài khoản
      </Button>
    </div>
  );
}
