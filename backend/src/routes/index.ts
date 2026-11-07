import { Router } from "express";
import videoRoutes from "./videoRoutes";
import documentRoutes from "./documentRoutes";
import ragRoutes from "./ragRoutes";
import historyRoutes from "./historyRoutes";
import settingsRoutes from "./settingsRoutes";

const router = Router();

router.use("/video", videoRoutes);
router.use("/document", documentRoutes);
router.use("/rag", ragRoutes);
router.use("/history", historyRoutes);
router.use("/settings", settingsRoutes);

export default router;
