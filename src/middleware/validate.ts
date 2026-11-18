import type { RequestHandler } from "express";
import type { z } from "zod";
import { AppError } from "../lib/errors.js";

type Source = "body" | "query" | "params";

/**
 * Validates and parses req[source] with a Zod schema.
 * The parsed (typed, trimmed, defaulted) value is stored on res.locals[source].
 */
export function validate(schema: z.ZodType, source: Source = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return next(AppError.badRequest("Validation failed", details));
    }
    res.locals[source] = result.data;
    next();
  };
}
