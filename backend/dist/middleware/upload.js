"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = config_1.config.uploadDir;
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const unique = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, unique);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 80 * 1024 * 1024 // 80 MB max
    }
});
