import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const idToken = token.idToken as string;

  if (idToken) {
    const logoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(
      process.env.NEXTAUTH_URL || "",
    )}&id_token_hint=${idToken}`;

    return NextResponse.redirect(logoutUrl);
  }

  return NextResponse.redirect(new URL("/", req.url));
}
