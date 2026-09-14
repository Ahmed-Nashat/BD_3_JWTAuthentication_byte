import app from "../src/app.js";
import { initializeDatabase } from "../src/config/sqlite.js";

export default async function handler(req, res) {
  initializeDatabase();
  return app(req, res);
}
