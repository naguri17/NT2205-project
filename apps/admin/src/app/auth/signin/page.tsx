"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { status } = useSession();
  const isSigningIn = useRef(false);

  useEffect(() => {
    // Prevent multiple signIn calls
    if (isSigningIn.current) return;

    // If already authenticated, redirect to callback
    // Chỉ redirect nếu có session và không phải đang trong quá trình OAuth callback
    if (status === "authenticated" && !window.location.pathname.includes("/api/auth/callback")) {
      // Use router.push thay vì window.location để tránh full page reload
      router.push(callbackUrl);
      return;
    }

    // Only trigger signIn when status is confirmed as unauthenticated
    // Và không phải đang trong quá trình OAuth callback
    if (status === "unauthenticated" && !window.location.pathname.includes("/api/auth/callback")) {
      isSigningIn.current = true;
      signIn("keycloak", { callbackUrl });
    }
  }, [callbackUrl, status, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-gray-500">
          Đang chuyển hướng đến trang đăng nhập...
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
