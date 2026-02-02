"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerSigner = exports.LocalSigner = void 0;
exports.createSigner = createSigner;
const local_1 = require("./local");
const ledger_1 = require("./ledger");
var local_2 = require("./local");
Object.defineProperty(exports, "LocalSigner", { enumerable: true, get: function () { return local_2.LocalSigner; } });
var ledger_2 = require("./ledger");
Object.defineProperty(exports, "LedgerSigner", { enumerable: true, get: function () { return ledger_2.LedgerSigner; } });
__exportStar(require("./types"), exports);
function createSigner(config) {
    switch (config.type) {
        case 'local':
            if (!config.privateKey) {
                throw new Error('Private key is required for local signer');
            }
            return new local_1.LocalSigner(config.privateKey, config.rpcUrl);
        case 'ledger':
            return new ledger_1.LedgerSigner(config.rpcUrl, config.derivationPath);
        default:
            throw new Error(`Unknown signer type: ${config.type}`);
    }
}
