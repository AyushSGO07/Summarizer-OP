"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
router.get("/", settingsController_1.settingsController.getSettings);
router.put("/", settingsController_1.settingsController.updateSettings);
router.get("/health", settingsController_1.settingsController.getSystemHealth);
exports.default = router;
