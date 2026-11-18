import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { passwordSchema } from "../auth/auth.schemas.js";
import type { UserRepository } from "./user.repository.js";
import { toPublicUser } from "./user.types.js";

const updateMeSchema = z.object({ name: z.string().trim().min(1).max(100) });
const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function userRoutes(users: UserRepository, accessSecret: string): Router {
  const router = Router();
  router.use(authenticate(accessSecret));

  router.get("/me", async (req, res) => {
    const user = await users.findById(req.user!.id);
    if (!user) throw AppError.notFound("User not found");
    res.json({ user: toPublicUser(user) });
  });

  router.patch("/me", validate(updateMeSchema), async (req, res) => {
    const user = await users.update(req.user!.id, res.locals.body);
    if (!user) throw AppError.notFound("User not found");
    res.json({ user: toPublicUser(user) });
  });

  router.post("/me/password", validate(changePasswordSchema), async (req, res) => {
    const user = await users.findById(req.user!.id);
    if (!user) throw AppError.notFound("User not found");
    if (!(await verifyPassword(res.locals.body.currentPassword, user.passwordHash))) {
      throw AppError.badRequest("Current password is incorrect");
    }
    await users.update(user.id, { passwordHash: await hashPassword(res.locals.body.newPassword) });
    res.status(204).end();
  });

  // Example of a role-protected endpoint.
  router.get("/", requireRole("admin"), validate(paginationSchema, "query"), async (_req, res) => {
    const { page, limit } = res.locals.query;
    const result = await users.list(page, limit);
    res.json({ ...result, items: result.items.map(toPublicUser) });
  });

  return router;
}
