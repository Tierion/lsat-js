"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdFromRequest = exports.decode = exports.isHex = void 0;
const bolt11_1 = __importDefault(require("bolt11"));
const bsert_1 = __importDefault(require("bsert"));
/**
 * @description Given a string, determine if it is in hex encoding or not.
 * @param {string} h - string to evaluate
 */
function isHex(h) {
    return Buffer.from(h, 'hex').toString('hex') === h;
}
exports.isHex = isHex;
// A wrapper around bolt11's decode to handle
// simnet invoices
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decode(req) {
    let network;
    if (req.indexOf('lnsb') === 0)
        network = { bech32: 'sb' };
    return bolt11_1.default.decode(req, network);
}
exports.decode = decode;
function getIdFromRequest(req) {
    const request = decode(req);
    const hashTag = request.tags.find((tag) => tag.tagName === 'payment_hash');
    bsert_1.default(hashTag && hashTag.data, 'Could not find payment hash on invoice request');
    const paymentHash = hashTag === null || hashTag === void 0 ? void 0 : hashTag.data.toString();
    if (!paymentHash || !paymentHash.length)
        throw new Error('Could not get payment hash from payment request');
    return paymentHash;
}
exports.getIdFromRequest = getIdFromRequest;
