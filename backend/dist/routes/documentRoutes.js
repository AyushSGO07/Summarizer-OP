"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.post("/summarize", upload_1.upload.single("file"), documentController_1.documentController.summarizeFile);
exports.default = router;
