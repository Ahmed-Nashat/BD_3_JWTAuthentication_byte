import jwt from "jsonwebtoken";
import { TokenUsage } from "../models/tokenUsage.model.js";

const unauthorized = (res, msg) => res.status(401).json({ success: false, msg });

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return unauthorized(res, "A Bearer token is required");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const tokenUsage = await TokenUsage.findOne({
      jti: payload.jti,
      userId: payload.sub,
    });

    if (!tokenUsage) {
      return unauthorized(res, "This token is not recognized");
    }

    if (tokenUsage.revokedAt || tokenUsage.remainingUses <= 0) {
      return unauthorized(res, "This token was revoked after 10 protected requests");
    }

    tokenUsage.remainingUses -= 1;
    if (tokenUsage.remainingUses === 0) {
      tokenUsage.revokedAt = new Date();
    }
    await tokenUsage.save();

    req.auth = {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
      remainingUses: tokenUsage.remainingUses,
    };
    res.set("X-Token-Uses-Remaining", String(tokenUsage.remainingUses));
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return unauthorized(res, "This token has expired. Please log in again.");
    }
    if (error.name === "JsonWebTokenError") {
      return unauthorized(res, "The token is invalid");
    }
    return next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({
      success: false,
      msg: "You do not have permission to access this resource",
    });
  }
  return next();
};

