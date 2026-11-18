import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { MongoRefreshTokenRepository } from "./modules/auth/refresh-token.mongo.js";
import { MongoUserRepository } from "./modules/users/user.mongo.js";

async function main() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  logger.info("Connected to MongoDB");

  const app = createApp({
    env,
    users: new MongoUserRepository(),
    refreshTokens: new MongoRefreshTokenRepository(),
  });

  const server = app.listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start");
  process.exit(1);
});
