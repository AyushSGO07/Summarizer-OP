import { Router } from "express";
import { historyController } from "../controllers/historyController";

const router = Router();

router.get("/", historyController.getAll);
router.get("/stats", historyController.getStats);
router.get("/:id", historyController.getById);
router.delete("/clear", historyController.clear);
router.delete("/:id", historyController.delete);

export default router;
