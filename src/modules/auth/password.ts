import bcrypt from "bcryptjs";
import { randomToken } from "../../lib/crypto.js";

const ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/**
 * Compared against when the email doesn't exist, so a failed login takes the
 * same time either way and attackers can't probe which emails are registered.
 */
export const DUMMY_HASH = bcrypt.hashSync(randomToken(16), ROUNDS);
