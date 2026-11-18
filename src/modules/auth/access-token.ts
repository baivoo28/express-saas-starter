import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../../lib/errors.js";
import { ROLES, type Role } from "../users/user.types.js";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (
      typeof decoded === "object" &&
      typeof decoded.sub === "string" &&
      ROLES.includes(decoded.role as Role)
    ) {
      return { sub: decoded.sub, role: decoded.role as Role };
    }
  } catch {
    // fall through
  }
  throw AppError.unauthorized("Invalid or expired access token");
}
