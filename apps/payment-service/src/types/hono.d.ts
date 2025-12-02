import { JwtPayload } from "jsonwebtoken";

export type Variables = {
  user: JwtPayload | string;
};
