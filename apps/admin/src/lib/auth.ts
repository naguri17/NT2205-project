import { NextAuthOptions, Session } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import { Buffer } from "buffer";
import { signOut } from "next-auth/react";

async function isTokenActive(accessToken: string): Promise<boolean> {
  const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token/introspect`;
  const authHeader = Buffer.from(
    `${process.env.KEYCLOAK_CLIENT_ID}:${process.env.KEYCLOAK_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: `token=${accessToken}`,
    });
    const data = await response.json();
    return data.active === true;
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }

      if (token.accessToken) {
        const isActive = await isTokenActive(token.accessToken);
        if (!isActive) {
          return {};
        }

        try {
          const decodedAccessToken = jwtDecode(token.accessToken);
          const realmAccess = (decodedAccessToken as any).realm_access;
          token.roles = realmAccess?.roles || [];
        } catch {
          token.roles = [];
        }
      } else if (!account) {
        return {};
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.roles = token.roles;
        session.user.id = token.sub;
      } else {
        return null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export const handleFederatedLogout = async (session: Session | null) => {
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
