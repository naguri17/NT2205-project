import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const roles = (token?.roles as string[]) || [];

    const isAdmin = roles.includes("admin") || roles.includes("Admin");
    const isUnauthorizedPage = req.nextUrl.pathname === "/unauthorized";

    if (token && !isAdmin && !isUnauthorizedPage) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (!token || !token.accessToken) {
          return false;
        }
        return true;
      },
    },
    pages: {
      signIn: "/api/auth/signin/keycloak",
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|login-start).*)",
  ],
};
