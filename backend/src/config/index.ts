import path from "path";
import os from "os";
import dotenv from "dotenv";

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const isVercel = Boolean(process.env.VERCEL);

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  get aiServiceUrl(): string {
    return (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").trim();
  },
  get dataDir(): string {
    return isVercel
      ? path.join(os.tmpdir(), "summarizer_op_data")
      : path.resolve(__dirname, "../../data");
  },
  get uploadDir(): string {
    return isVercel
      ? path.join(os.tmpdir(), "summarizer_op_uploads")
      : path.resolve(__dirname, "../../uploads");
  },
  corsOrigins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
};
