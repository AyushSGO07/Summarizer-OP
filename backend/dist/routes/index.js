"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoRoutes_1 = __importDefault(require("./videoRoutes"));
const documentRoutes_1 = __importDefault(require("./documentRoutes"));
const ragRoutes_1 = __importDefault(require("./ragRoutes"));
const historyRoutes_1 = __importDefault(require("./historyRoutes"));
const settingsRoutes_1 = __importDefault(require("./settingsRoutes"));
const router = (0, express_1.Router)();
router.use("/video", videoRoutes_1.default);
router.use("/document", documentRoutes_1.default);
router.use("/rag", ragRoutes_1.default);
router.use("/history", historyRoutes_1.default);
router.use("/settings", settingsRoutes_1.default);
exports.default = router;
