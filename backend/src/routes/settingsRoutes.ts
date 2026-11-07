import { Router } from "express";
import { settingsController } from "../controllers/settingsController";

const router = Router();

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);
router.get("/health", settingsController.getSystemHealth);

export default router;
