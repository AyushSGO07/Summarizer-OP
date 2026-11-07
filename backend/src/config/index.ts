import path from "path";
import dotenv from "dotenv";

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  dataDir: path.resolve(__dirname, "../../data"),
  uploadDir: path.resolve(__dirname, "../../uploads"),
  corsOrigins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
};
