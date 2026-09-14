import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "../public")));
app.get("/api/health", (req, res) => res.status(200).json({ success: true, msg: "JWT API is running" }));
app.use("/api/auth", authRouter);
app.use((req, res) => res.status(404).json({ success: false, msg: "Route not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ success: false, msg: "Internal server error" });
});

export default app;
