#!/usr/bin/env node
/**
 * Generates a scrypt password hash for ADMIN_PASSWORD_HASH or SUPPORT_PASSWORD_HASH.
 * Usage: node scripts/generate-password-hash.mjs [password]
 * Default password: ChangeMe123!
 */
import { randomBytes, scryptSync } from "crypto";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = "scrypt";
const PASSWORD_HASH_DELIMITER = "::";

const password = process.argv[2] || "ChangeMe123!";
const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
const hash = `${PASSWORD_HASH_PREFIX}${PASSWORD_HASH_DELIMITER}${salt}${PASSWORD_HASH_DELIMITER}${derived}`;
console.log(hash);
