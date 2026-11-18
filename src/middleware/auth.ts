import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../modules/auth/access-token.js";
import type { Role } from "../modules/users/user.types.js";

/** Requires a valid `Authorization: Bearer <access token>` header. */
export function authenticate(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next(AppError.unauthorized());
    const payload = verifyAccessToken(header.slice(7), secret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  };
}

/** Use after authenticate(). */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}
