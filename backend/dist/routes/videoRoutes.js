"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoController_1 = require("../controllers/videoController");
const router = (0, express_1.Router)();
router.post("/metadata", videoController_1.videoController.getMetadata);
router.post("/summarize", videoController_1.videoController.summarize);
exports.default = router;
