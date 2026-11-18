import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import type { RefreshTokenRepository } from "./modules/auth/refresh-token.repository.js";
import type { UserRepository } from "./modules/users/user.repository.js";
import { userRoutes } from "./modules/users/user.routes.js";

export interface AppDeps {
  env: Env;
  users: UserRepository;
  refreshTokens: RefreshTokenRepository;
}

export function createApp({ env, users, refreshTokens }: AppDeps): Express {
  const app = express();
  const isTest = env.NODE_ENV === "test";

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  if (!isTest) app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  const auth = new AuthService({ env, users, refreshTokens });
  app.use("/api/auth", authRoutes(auth, { accessSecret: env.JWT_ACCESS_SECRET, rateLimit: !isTest }));
  app.use("/api/users", userRoutes(users, env.JWT_ACCESS_SECRET));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
