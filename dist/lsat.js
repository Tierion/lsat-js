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
exports.Lsat = exports.parseChallengePart = void 0;
const assert = require('bsert');
const bufio = require('bufio');
const crypto_1 = __importDefault(require("crypto"));
const Macaroon = __importStar(require("macaroon"));
const _1 = require(".");
const helpers_1 = require("./helpers");
/** Helpers */
function parseChallengePart(challenge) {
    let macaroon;
    const separatorIndex = challenge.indexOf('=');
    assert(separatorIndex > -1, 'Incorrectly encoded macaroon challenge. Missing "=" separator.');
    // slice off `[challengeType]=`
    const splitIndex = challenge.length - 1 - separatorIndex;
    macaroon = challenge.slice(-splitIndex);
    assert(macaroon.length, 'Incorrectly encoded macaroon challenge');
    assert(macaroon[0] === '"' && macaroon[macaroon.length - 1] === '"', 'Incorecctly encoded macaroon challenge, must be enclosed in double quotes.');
    macaroon = macaroon.slice(1, macaroon.length - 1);
    return macaroon;
}
exports.parseChallengePart = parseChallengePart;
/**
 * @description A a class for creating and converting LSATs
 */
class Lsat extends bufio.Struct {
    constructor(options) {
        super(options);
        this.id = '';
        this.validUntil = 0;
        this.invoice = '';
        this.baseMacaroon = '';
        this.paymentHash = Buffer.alloc(32).toString('hex');
        this.timeCreated = Date.now();
        this.paymentPreimage = null;
        this.amountPaid = 0;
        this.routingFeePaid = 0;
        this.invoiceAmount = 0;
        if (options)
            this.fromOptions(options);
    }
    fromOptions(options) {
        assert(typeof options.baseMacaroon === 'string', 'Require serialized macaroon');
        this.baseMacaroon = options.baseMacaroon;
        assert(typeof options.id === 'string', 'Require string id');
        this.id = options.id;
        assert(typeof options.paymentHash === 'string', 'Require paymentHash');
        this.paymentHash = options.paymentHash;
        const expiration = this.getExpirationFromMacaroon(options.baseMacaroon);
        if (expiration)
            this.validUntil = expiration;
        if (options.invoice) {
            this.addInvoice(options.invoice);
        }
        if (options.timeCreated)
            this.timeCreated = options.timeCreated;
        if (options.paymentPreimage)
            this.paymentPreimage = options.paymentPreimage;
        if (options.amountPaid)
            this.amountPaid = options.amountPaid;
        if (options.routingFeePaid)
            this.routingFeePaid = options.routingFeePaid;
        return this;
    }
    /**
     * @description Determine if the LSAT is expired or not. This is based on the
     * `validUntil` property of the lsat which is evaluated at creation time
     * based on the macaroon and any existing expiration caveats
     * @returns {boolean}
     */
    isExpired() {
        if (this.validUntil === 0)
            return false;
        return this.validUntil < Date.now();
    }
    /**
     * @description Determines if the lsat is pending based on if it has a preimage
     * @returns {boolean}
     */
    isPending() {
        return this.paymentPreimage ? false : true;
    }
    /**
     * @description Determines if the lsat is valid based on a valid preimage or not
     * @returns {boolean}
     */
    isSatisfied() {
        if (!this.paymentHash)
            return false;
        if (!this.paymentPreimage)
            return false;
        const hash = crypto_1.default
            .createHash('sha256')
            .update(Buffer.from(this.paymentPreimage, 'hex'))
            .digest('hex');
        if (hash !== this.paymentHash)
            return false;
        return true;
    }
    /**
     * @description Gets the base macaroon from the lsat
     * @returns {MacaroonInterface}
     */
    getMacaroon() {
        return Macaroon.importMacaroon(this.baseMacaroon)._exportAsJSONObjectV2();
    }
    /**
     * @description A utility for returning the expiration date of the LSAT's macaroon based on
     * an optional caveat
     * @param {string} [macaroon] - raw macaroon to get expiration date from if exists as a caveat. If
     * none is provided then it will use LSAT's base macaroon. Will throw if neither exists
     * @returns {number} expiration date
     */
    getExpirationFromMacaroon(macaroon) {
        if (!macaroon)
            macaroon = this.baseMacaroon;
        assert(macaroon, 'Missing macaroon');
        const caveatPackets = Macaroon.importMacaroon(macaroon)._exportAsJSONObjectV2().c;
        const expirationCaveats = [];
        if (caveatPackets == undefined) {
            return 0;
        }
        for (const cav of caveatPackets) {
            if (cav.i == undefined) {
                continue;
            }
            const caveat = _1.Caveat.decode(cav.i);
            if (caveat.condition === 'expiration')
                expirationCaveats.push(caveat);
        }
        // return zero if no expiration caveat
        if (!expirationCaveats.length)
            return 0;
        // want to return the last expiration caveat
        return Number(expirationCaveats[expirationCaveats.length - 1].value);
    }
    /**
     * @description A utility for setting the preimage for an LSAT. This method will validate the preimage and throw
     * if it is either of the incorrect length or does not match the paymentHash
     * @param {string} preimage - 32-byte hex string of the preimage that is used as proof of payment of a lightning invoice
     */
    setPreimage(preimage) {
        assert(helpers_1.isHex(preimage) && preimage.length === 64, 'Must pass valid 32-byte hash for lsat secret');
        const hash = crypto_1.default
            .createHash('sha256')
            .update(Buffer.from(preimage, 'hex'))
            .digest('hex');
        assert(hash === this.paymentHash, "Hash of preimage did not match LSAT's paymentHash");
        this.paymentPreimage = preimage;
    }
    /**
     * @description Add a first party caveat onto the lsat's base macaroon.
     * This method does not validate the caveat being added. So, for example, a
     * caveat that would fail validation on submission could still be added (e.g. an
     * expiration that is less restrictive then a previous one). This should be done by
     * the implementer
     * @param {Caveat} caveat - caveat to add to the macaroon
     * @returns {void}
     */
    addFirstPartyCaveat(caveat) {
        assert(caveat instanceof _1.Caveat, 'Require a Caveat object to add to macaroon');
        const mac = Macaroon.importMacaroon(this.baseMacaroon);
        mac.addFirstPartyCaveat(caveat.encode());
        this.baseMacaroon = Macaroon.bytesToBase64(mac._exportBinaryV2());
    }
    /**
     * @description Get a list of caveats from the base macaroon
     * @returns {Caveat[]} caveats - list of caveats
     */
    getCaveats() {
        const caveats = [];
        const caveatPackets = this.getMacaroon().c;
        if (caveatPackets == undefined) {
            return caveats;
        }
        for (const cav of caveatPackets) {
            if (cav.i == undefined) {
                continue;
            }
            caveats.push(_1.Caveat.decode(cav.i));
        }
        return caveats;
    }
    /**
     * @description Converts the lsat into a valid LSAT token for use in an http
     * Authorization header. This will return a string in the form: "LSAT [macaroon]:[preimage?]".
     *  If no preimage is available the last character should be a colon, which would be
     * an "incomplete" LSAT
     * @returns {string}
     */
    toToken() {
        return `LSAT ${this.baseMacaroon}:${this.paymentPreimage || ''}`;
    }
    /**
     * @description Converts LSAT into a challenge header to return in the WWW-Authenticate response
     * header. Returns base64 encoded string with macaroon and invoice information prefixed with
     * authentication type ("LSAT")
     * @returns {string}
     */
    toChallenge() {
        assert(this.invoice, `Can't create a challenge without a payment request/invoice`);
        const challenge = `macaroon="${this.baseMacaroon}", invoice="${this.invoice}"`;
        return `LSAT ${challenge}`;
    }
    toJSON() {
        return {
            id: this.id,
            validUntil: this.validUntil,
            invoice: this.invoice,
            baseMacaroon: this.baseMacaroon,
            paymentHash: this.paymentHash,
            timeCreated: this.timeCreated,
            paymentPreimage: this.paymentPreimage || undefined,
            amountPaid: this.amountPaid || undefined,
            invoiceAmount: this.invoiceAmount,
            routingFeePaid: this.routingFeePaid || undefined,
            isPending: this.isPending(),
            isSatisfied: this.isSatisfied()
        };
    }
    addInvoice(invoice) {
        assert(this.paymentHash, 'Cannot add invoice data to an LSAT without paymentHash');
        try {
            const data = helpers_1.decode(invoice);
            const { satoshis: tokens } = data;
            const hashTag = data.tags.find((tag) => tag.tagName === 'payment_hash');
            assert(hashTag, 'Could not find payment hash on invoice request');
            const paymentHash = hashTag === null || hashTag === void 0 ? void 0 : hashTag.data;
            assert(paymentHash === this.paymentHash, 'paymentHash from invoice did not match LSAT');
            this.invoiceAmount = tokens || 0;
            this.invoice = invoice;
        }
        catch (e) {
            throw new Error(`Problem adding invoice data to LSAT: ${e.message}`);
        }
    }
    // Static API
    /**
     * @description generates a new LSAT from an invoice and an optional invoice
     * @param {string} macaroon - macaroon to parse and generate relevant lsat properties from
     * @param {string} [invoice] - optional invoice which can provide other relevant information for the lsat
     */
    static fromMacaroon(macaroon, invoice) {
        assert(typeof macaroon === 'string', 'Requires a raw macaroon string for macaroon to generate LSAT');
        const identifier = Macaroon.importMacaroon(macaroon)._exportAsJSONObjectV2().i;
        let id;
        try {
            if (identifier == undefined) {
                throw new Error(`macaroon identifier undefined`);
            }
            id = _1.Identifier.fromString(identifier);
        }
        catch (e) {
            throw new Error(`Unexpected encoding for macaroon identifier: ${e.message}`);
        }
        const options = {
            id: identifier,
            baseMacaroon: macaroon,
            paymentHash: id.paymentHash.toString('hex'),
        };
        const lsat = new this(options);
        if (invoice) {
            lsat.addInvoice(invoice);
        }
        return lsat;
    }
    /**
     * @description Create an LSAT from an http Authorization header. A useful utility
     * when trying to parse an LSAT sent in a request and determining its validity
     * @param {string} token - LSAT token sent in request
     * @param {string} invoice - optional payment request information to intialize lsat with
     * @returns {Lsat}
     */
    static fromToken(token, invoice) {
        assert(token.includes(this.type), 'Token must include LSAT prefix');
        token = token.slice(this.type.length).trim();
        const [macaroon, preimage] = token.split(':');
        const lsat = Lsat.fromMacaroon(macaroon, invoice);
        if (preimage)
            lsat.setPreimage(preimage);
        return lsat;
    }
    /**
     * @description Validates and converts an LSAT challenge from a WWW-Authenticate header
     * response into an LSAT object. This method expects an invoice and a macaroon in the challenge
     * @param {string} challenge
     * @returns {Lsat}
     */
    static fromChallenge(challenge) {
        const macChallenge = 'macaroon=';
        const invoiceChallenge = 'invoice=';
        let challenges;
        challenges = challenge.split(',');
        // add support for challenges that are separated with just a space
        if (challenges.length < 2)
            challenges = challenge.split(' ');
        // if we still don't have at least two, then there was a malformed header/challenge
        assert(challenges.length >= 2, 'Expected at least two challenges in the LSAT: invoice and macaroon');
        let macaroon = '', invoice = '';
        // get the indexes of the challenge strings so that we can split them
        // kind of convoluted but it takes into account challenges being in the wrong order
        // and for excess challenges that we can ignore
        for (const c of challenges) {
            // check if we're looking at the macaroon challenge
            if (!macaroon.length && c.indexOf(macChallenge) > -1) {
                try {
                    macaroon = parseChallengePart(c);
                }
                catch (e) {
                    throw new Error(`Problem parsing macaroon challenge: ${e.message}`);
                }
            }
            // check if we're looking at the invoice challenge
            if (!invoice.length && c.indexOf(invoiceChallenge) > -1) {
                try {
                    invoice = parseChallengePart(c);
                }
                catch (e) {
                    throw new Error(`Problem parsing macaroon challenge: ${e.message}`);
                }
            }
            // if there are other challenges but we have mac and invoice then we can break
            // as they are not LSAT relevant anyway
            if (invoice.length && macaroon.length)
                break;
        }
        assert(invoice.length && macaroon.length, 'Expected WWW-Authenticate challenge with macaroon and invoice data');
        const paymentHash = helpers_1.getIdFromRequest(invoice);
        let identifier;
        const mac = Macaroon.importMacaroon(macaroon);
        identifier = mac._exportAsJSONObjectV2().i;
        if (identifier == undefined) {
            identifier = mac._exportAsJSONObjectV2().i64;
            if (identifier == undefined) {
                throw new Error(`Problem parsing macaroon identifier`);
            }
        }
        return new this({
            id: identifier,
            baseMacaroon: macaroon,
            paymentHash,
            invoice: invoice,
        });
    }
    /**
     * @description Given an LSAT WWW-Authenticate challenge header (with token type, "LSAT", prefix)
     * will return an Lsat.
     * @param header
     */
    static fromHeader(header) {
        // remove the token type prefix to get the challenge
        const challenge = header.slice(this.type.length).trim();
        assert(header.length !== challenge.length, 'header missing token type prefix "LSAT"');
        return Lsat.fromChallenge(challenge);
    }
}
exports.Lsat = Lsat;
Lsat.type = 'LSAT';
