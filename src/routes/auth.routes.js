import { Router } from "express";
import { adminDashboard, login, profile, register } from "../controllers/auth.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/profile", authenticate, profile);
authRouter.get("/admin", authenticate, authorizeRoles("admin"), adminDashboard);

export default authRouter;

