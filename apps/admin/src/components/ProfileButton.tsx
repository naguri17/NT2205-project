"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function ProfileButton() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const user = session?.user;

  const handleLogout = async () => {
    const idToken = session?.idToken;

    await signOut({ redirect: false });

    if (idToken) {
      const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;

      const postLogoutRedirectUri = window.location.origin + "/auth/signin";

      const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

      window.location.href = logoutUrl;
    } else {
      window.location.href = "/auth/signin";
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div>
        <button
          onClick={() => setOpen((s) => !s)}
          aria-haspopup="true"
          aria-expanded={open}
          className="w-9 h-9 rounded-full text-black bg-gray-200 flex items-center justify-center text-sm"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <span className="font-medium">
              {user?.name?.[0] ?? user?.email?.[0] ?? "U"}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white text-black border rounded shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="font-medium">{user?.name ?? user?.email}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>

            <div className="flex flex-col p-2">
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-left text-sm text-red-600 rounded hover:bg-gray-100"
              >
                ➡️ Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
