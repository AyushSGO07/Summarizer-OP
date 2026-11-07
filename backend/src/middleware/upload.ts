import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = config.uploadDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${uuidv4()}${ext}`;
    cb(null, unique);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024 // 80 MB max
  }
});
