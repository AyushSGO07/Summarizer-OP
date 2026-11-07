import { Router } from "express";
import { videoController } from "../controllers/videoController";

const router = Router();

router.post("/metadata", videoController.getMetadata);
router.post("/summarize", videoController.summarize);

export default router;
