import { Router } from "express";
import { documentController } from "../controllers/documentController";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/summarize", upload.single("file"), documentController.summarizeFile);

export default router;
