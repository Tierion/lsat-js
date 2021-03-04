"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirstPartyMacaroon = exports.verifyCaveats = exports.hasCaveat = exports.Caveat = exports.ErrInvalidCaveat = void 0;
/**
 * @file Provides utilities for managing, analyzing, and validating caveats
 * @author Buck Perley
 */
const bsert_1 = __importDefault(require("bsert"));
const Macaroon = __importStar(require("macaroon"));
let TextEncoder;
if (typeof window !== 'undefined' && window && window.TextEncoder) {
    TextEncoder = window.TextEncoder;
}
else {
    // No window.TextEncoder if it's node.js.
    const util = require('util');
    TextEncoder = util.TextEncoder;
}
const utf8Encoder = new TextEncoder();
const isValue = (x) => x !== undefined && x !== null;
const stringToBytes = (s) => isValue(s) ? utf8Encoder.encode(s) : s;
/**
 * @description Creates a new error describing a problem with creating a new caveat
 * @extends Error
 */
class ErrInvalidCaveat extends Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrInvalidCaveat);
        }
        this.name = 'ErrInvalidCaveat';
        // Custom debugging information
        this.message = `Caveat must be of the form "condition[<,=,>]value"`;
    }
}
exports.ErrInvalidCaveat = ErrInvalidCaveat;
const validComp = new Set(['<', '>', '=']);
/**
 * @typedef {Object} Caveat
 * @description A caveat is a class with a condition, value and a comparator. They
 * are used in macaroons to evaluate the validity of a macaroon. The Caveat class
 * provides a method for turning a string into a caveat object (decode) and a way to
 * turn a caveat into a string that can be encoded into a macaroon.
 */
class Caveat {
    /**
     * Create a caveat
     * @param {Object} options - options to create a caveat from
     * @param {string} options.condition - condition that will be evaluated, e.g. "expiration", "ip", etc.
     * @param {string} options.value - the value that the caveat should equal. When added to a macaroon this is what
     * the request is evaluated against.
     * @param {string} [comp="="] - one of "=", "<", ">" which describes how the value is compared. So "time<1576799124987"
     * would mean we will evaluate a time that is less than "1576799124987"
     */
    constructor(options) {
        this.condition = '';
        this.value = '';
        this.comp = '=';
        if (options)
            this.fromOptions(options);
    }
    fromOptions(options) {
        bsert_1.default(options, 'Data required to create new caveat');
        bsert_1.default(typeof options.condition === 'string' && options.condition.length, 'Require a condition');
        this.condition = options.condition;
        bsert_1.default(options.value, 'Requires a value to create a caveat');
        options.value.toString();
        this.value = options.value;
        if (options.comp) {
            if (!validComp.has(options.comp))
                throw new ErrInvalidCaveat();
            this.comp = options.comp;
        }
        return this;
    }
    /**
     * @returns {string} Caveat as string value. e.g. `expiration=1576799124987`
     */
    encode() {
        return `${this.condition}${this.comp}${this.value}`;
    }
    /**
     *
     * @param {string} c - create a new caveat from a string
     * @returns {Caveat}
     */
    static decode(c) {
        let compIndex;
        for (let i = 0; i < c.length; i++) {
            if (validComp.has(c[i])) {
                compIndex = i;
                break;
            }
        }
        if (!compIndex)
            throw new ErrInvalidCaveat();
        const condition = c.slice(0, compIndex).trim();
        const comp = c[compIndex].trim();
        const value = c.slice(compIndex + 1).trim();
        return new this({ condition, comp, value });
    }
}
exports.Caveat = Caveat;
/**
 * @description hasCaveat will take a macaroon and a caveat and evaluate whether or not
 * that caveat exists on the macaroon
 * @param {string} rawMac - raw macaroon to determine caveats from
 * @param {Caveat|string} c - Caveat to test against macaroon
 * @returns {boolean}
 */
function hasCaveat(rawMac, c) {
    const macaroon = Macaroon.importMacaroon(rawMac)._exportAsJSONObjectV2();
    let caveat;
    if (typeof c === 'string')
        caveat = Caveat.decode(c);
    else
        caveat = c;
    const condition = caveat.condition;
    if (macaroon.c == undefined) {
        return false;
    }
    let value;
    macaroon.c.forEach((packet) => {
        try {
            if (packet.i != undefined) {
                const test = Caveat.decode(packet.i);
                if (condition === test.condition)
                    value = test.value;
            }
        }
        catch (e) {
            // ignore if caveat is unable to be decoded since we don't know it anyway
        }
    });
    if (value)
        return value;
    return false;
}
exports.hasCaveat = hasCaveat;
/**
 * @description A function that verifies the caveats on a macaroon.
 * The functionality mimics that of loop's lsat utilities.
 * @param caveats a list of caveats to verify
 * @param {Satisfier} satisfiers a single satisfier or list of satisfiers used to verify caveats
 * @param {Object} [options] An optional options object that will be passed to the satisfiers.
 * In many circumstances this will be a request object, for example when this is used in a server
 * @returns {boolean}
 */
function verifyCaveats(caveats, satisfiers, options = {}) {
    bsert_1.default(satisfiers, 'Must have satisfiers in order to verify caveats');
    // if there are no satisfiers then we can just assume everything is verified
    if (!satisfiers)
        return true;
    else if (!Array.isArray(satisfiers))
        satisfiers = [satisfiers];
    // create map of satisfiers keyed by their conditions
    const caveatSatisfiers = new Map();
    for (const satisfier of satisfiers) {
        caveatSatisfiers.set(satisfier.condition, satisfier);
    }
    // create a map of relevant caveats to satisfiers keyed by condition
    // with an array of caveats for each condition
    const relevantCaveats = new Map();
    for (const caveat of caveats) {
        // skip if condition is not in our satisfier map
        const condition = caveat.condition;
        if (!caveatSatisfiers.has(condition))
            continue;
        if (!relevantCaveats.has(condition))
            relevantCaveats.set(condition, []);
        const caveatArray = relevantCaveats.get(condition);
        caveatArray.push(caveat);
        relevantCaveats.set(condition, caveatArray);
    }
    // for each condition in the caveat map
    for (const [condition, caveatsList] of relevantCaveats) {
        // get the satisifer for that condition
        const satisfier = caveatSatisfiers.get(condition);
        // loop through the array of caveats
        for (let i = 0; i < caveatsList.length - 1; i++) {
            // confirm satisfyPrevious
            const prevCaveat = caveatsList[i];
            const curCaveat = caveatsList[i + 1];
            if (!satisfier.satisfyPrevious(prevCaveat, curCaveat, options))
                return false;
        }
        // check satisfyFinal for the final caveat
        if (!satisfier.satisfyFinal(caveatsList[caveatsList.length - 1], options))
            return false;
    }
    return true;
}
exports.verifyCaveats = verifyCaveats;
/**
 * @description verifyFirstPartyMacaroon will check if a macaroon is valid or
 * not based on a set of satisfiers to pass as general caveat verifiers. This will also run
 * against caveat.verityCaveats to ensure that satisfyPrevious will validate
 * @param {string} macaroon A raw macaroon to run a verifier against
 * @param {String} secret The secret key used to sign the macaroon
 * @param {(Satisfier | Satisfier[])} satisfiers a single satisfier or list of satisfiers used to verify caveats
 * @param {Object} [options] An optional options object that will be passed to the satisfiers.
 * In many circumstances this will be a request object, for example when this is used in a server
 * @returns {boolean}
 */
function verifyFirstPartyMacaroon(rawMac, secret, satisfiers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
options = {}) {
    // if given a raw macaroon string, convert to a Macaroon class
    const macaroon = Macaroon.importMacaroon(rawMac);
    const secretBytesArray = stringToBytes(secret);
    const verify = function (rawCaveat) {
        const caveat = Caveat.decode(rawCaveat);
        if (satisfiers) {
            if (!Array.isArray(satisfiers))
                satisfiers = [satisfiers];
            for (const satisfier of satisfiers) {
                if (satisfier.condition !== caveat.condition)
                    return "not satisifed";
                const valid = satisfier.satisfyFinal(caveat, options);
                if (valid) {
                    return null;
                }
                return "not satisfied";
            }
        }
    };
    try {
        macaroon.verify(secretBytesArray, verify);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.verifyFirstPartyMacaroon = verifyFirstPartyMacaroon;
