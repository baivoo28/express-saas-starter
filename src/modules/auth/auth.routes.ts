import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas.js";
import type { AuthService } from "./auth.service.js";

export function authRoutes(auth: AuthService, opts: { accessSecret: string; rateLimit: boolean }): Router {
  const router = Router();

  // Brute-force protection for credential endpoints.
  if (opts.rateLimit) {
    router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false }));
  }

  router.post("/register", validate(registerSchema), async (_req, res) => {
    res.status(201).json(await auth.register(res.locals.body));
  });

  router.post("/login", validate(loginSchema), async (_req, res) => {
    res.json(await auth.login(res.locals.body));
  });

  router.post("/refresh", validate(refreshSchema), async (_req, res) => {
    res.json(await auth.refresh(res.locals.body.refreshToken));
  });

  router.post("/logout", validate(refreshSchema), async (_req, res) => {
    await auth.logout(res.locals.body.refreshToken);
    res.status(204).end();
  });

  router.post("/logout-all", authenticate(opts.accessSecret), async (req, res) => {
    await auth.logoutAll(req.user!.id);
    res.status(204).end();
  });

  return router;
}
