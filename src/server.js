import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 3002;

try {
  await connectDB();
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
} catch (error) {
  console.error("Unable to start server:", error.message);
  process.exit(1);
}
