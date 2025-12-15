import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { Buffer } from "buffer";
import { jwtDecode } from "jwt-decode";

async function isTokenActive(accessToken: string): Promise<boolean> {
  const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token/introspect`;

  const authHeader = Buffer.from(
    `${process.env.KEYCLOAK_CLIENT_ID}:${process.env.KEYCLOAK_ADMIN_SECRET}`
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
  } catch (error) {
    console.error("Check active error:", error);
    return false;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_ADMIN_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
        };
      },
    }),
  ],
  debug: true,
  session: {
    maxAge: 5 * 60,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.id = profile?.sub || token.sub;

        try {
          const decoded: any = jwtDecode(account.access_token);
          token.roles = decoded.realm_access?.roles || [];
          console.log("✅ Decoded Roles:", token.roles);
        } catch (error) {
          console.error("❌ Lỗi decode token:", error);
          token.roles = [];
        }
      }

      if (token.accessToken) {
        const isActive = await isTokenActive(token.accessToken as string);
        if (!isActive) {
          return {};
        }
      } else if (!token.accessToken && !account) {
        return {};
      }

      return token;
    },

    async session({ session, token }) {
      if (token.accessToken && Object.keys(token).length > 0) {
        session.isValidToken = true;
        session.accessToken = token.accessToken;
        session.idToken = token.idToken as string;
        session.user.id = token.id as string;
        session.user.roles = token.roles;
      } else {
        session.isValidToken = false;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
