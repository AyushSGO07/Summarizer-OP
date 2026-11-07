import { Router } from "express";
import { ragController } from "../controllers/ragController";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/index-file", upload.single("file"), ragController.indexFile);
router.post("/index-text", ragController.indexText);
router.post("/query", ragController.query);
router.get("/status", ragController.getStatus);

export default router;
