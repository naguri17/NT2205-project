import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { Buffer } from "buffer";

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
  } catch (error) {
    return false;
  }
}

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
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
    // Đảm bảo session kiểm tra lại trạng thái token sau mỗi 5 phút
    maxAge: 5 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.id = token.sub;
      }

      if (token.accessToken) {
        const isActive = await isTokenActive(token.accessToken);

        // Nếu Token không hoạt động, trả về object rỗng để hủy session
        if (!isActive) {
          return {};
        }
      } else if (!token.accessToken && !account) {
        // Trường hợp không có token, hủy session
        return {};
      }
      return token;
    },

    async session({ session, token }) {
      if (token.accessToken) {
        session.isValidToken = true;
        session.accessToken = token.accessToken;
        session.idToken = token.idToken as string;
        session.user.id = token.id as string;
      }

      if (!token.accessToken) {
        session.isValidToken = false;
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
