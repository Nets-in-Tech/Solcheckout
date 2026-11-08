"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = __importDefault(require("./server.js"));
exports.default = server_js_1.default;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = server_js_1.default;
    module.exports.default = server_js_1.default;
}
