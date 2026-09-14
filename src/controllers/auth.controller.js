import { getUserById, loginUser, registerUser } from "../services/auth.service.js";

const sendError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    msg: status >= 500 ? "Internal server error" : error.message,
  });
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const validateRegisterInput = ({ name, email, password }) => {
  if (typeof name !== "string" || name.trim().length < 2) badRequest("Name must contain at least 2 characters");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) badRequest("A valid email is required");
  if (typeof password !== "string" || password.length < 8) badRequest("Password must contain at least 8 characters");
};

const validateLoginInput = ({ email, password }) => {
  if (typeof email !== "string" || typeof password !== "string") badRequest("Email and password are required");
};

export const register = async (req, res) => {
  try {
    validateRegisterInput(req.body);
    const user = await registerUser(req.body);
    return res.status(201).json({ success: true, msg: "Account created", data: user });
  } catch (error) {
    return sendError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    validateLoginInput(req.body);
    const data = await loginUser(req.body);
    return res.status(200).json({ success: true, msg: "Login successful", data });
  } catch (error) {
    return sendError(res, error);
  }
};

export const profile = async (req, res) => {
  try {
    const user = await getUserById(req.auth.userId);
    return res.status(200).json({
      success: true,
      msg: "Protected profile data",
      data: { user, remainingUses: req.auth.remainingUses },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const adminDashboard = (req, res) =>
  res.status(200).json({
    success: true,
    msg: "Admin-only protected data",
    data: { remainingUses: req.auth.remainingUses },
  });

