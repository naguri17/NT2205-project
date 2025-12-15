import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    id?: string;
    roles?: string[];
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    isValidToken?: boolean;
    user: {
      roles?: string[];
      id?: string;
    } & DefaultSession["user"];
  }
}
