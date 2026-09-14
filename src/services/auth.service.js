import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { TokenUsage } from "../models/tokenUsage.model.js";
import { User } from "../models/user.model.js";

const TOKEN_LIMIT = 10;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw createError("JWT_SECRET is not configured", 500);
  }
  return process.env.JWT_SECRET;
};

const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const exists = await User.exists({ email: normalizedEmail });

  if (exists) {
    throw createError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "user",
  });

  return toPublicUser(user);
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError("Invalid email or password", 401);
  }

  const jti = crypto.randomUUID();
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, jti },
    getJwtSecret(),
    { expiresIn },
  );

  await TokenUsage.create({
    jti,
    userId: user._id,
    remainingUses: TOKEN_LIMIT,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    tokenLimit: TOKEN_LIMIT,
    user: toPublicUser(user),
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError("User account no longer exists", 401);
  }
  return toPublicUser(user);
};

