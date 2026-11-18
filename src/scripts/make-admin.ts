/**
 * Promote an existing user to admin:
 *   npm run make-admin -- someone@example.com
 */
import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { UserModel } from "../modules/users/user.mongo.js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

const env = loadEnv();
await mongoose.connect(env.MONGODB_URI);
const result = await UserModel.updateOne({ email }, { role: "admin" });
console.log(result.matchedCount ? `${email} is now an admin.` : `No user found with email ${email}.`);
await mongoose.disconnect();
