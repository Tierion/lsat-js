declare const bufio: any;
import * as Macaroon from 'macaroon';
import { Caveat } from '.';
import { LsatOptions } from './types';
declare type LsatJson = {
    validUntil: number;
    isPending: boolean;
    isSatisfied: boolean;
    invoiceAmount: number;
} & LsatOptions;
/** Helpers */
export declare function parseChallengePart(challenge: string): string;
/**
 * @description A a class for creating and converting LSATs
 */
export declare class Lsat extends bufio.Struct {
    id: string;
    baseMacaroon: string;
    paymentHash: string;
    paymentPreimage: string | null;
    validUntil: number;
    timeCreated: number;
    invoice: string;
    amountPaid: number | null;
    routingFeePaid: number | null;
    invoiceAmount: number;
    static type: string;
    constructor(options: LsatOptions);
    fromOptions(options: LsatOptions): this;
    /**
     * @description Determine if the LSAT is expired or not. This is based on the
     * `validUntil` property of the lsat which is evaluated at creation time
     * based on the macaroon and any existing expiration caveats
     * @returns {boolean}
     */
    isExpired(): boolean;
    /**
     * @description Determines if the lsat is pending based on if it has a preimage
     * @returns {boolean}
     */
    isPending(): boolean;
    /**
     * @description Determines if the lsat is valid based on a valid preimage or not
     * @returns {boolean}
     */
    isSatisfied(): boolean;
    /**
     * @description Gets the base macaroon from the lsat
     * @returns {MacaroonInterface}
     */
    getMacaroon(): Macaroon.MacaroonJSONV2;
    /**
     * @description A utility for returning the expiration date of the LSAT's macaroon based on
     * an optional caveat
     * @param {string} [macaroon] - raw macaroon to get expiration date from if exists as a caveat. If
     * none is provided then it will use LSAT's base macaroon. Will throw if neither exists
     * @returns {number} expiration date
     */
    getExpirationFromMacaroon(macaroon?: string): number;
    /**
     * @description A utility for setting the preimage for an LSAT. This method will validate the preimage and throw
     * if it is either of the incorrect length or does not match the paymentHash
     * @param {string} preimage - 32-byte hex string of the preimage that is used as proof of payment of a lightning invoice
     */
    setPreimage(preimage: string): void;
    /**
     * @description Add a first party caveat onto the lsat's base macaroon.
     * This method does not validate the caveat being added. So, for example, a
     * caveat that would fail validation on submission could still be added (e.g. an
     * expiration that is less restrictive then a previous one). This should be done by
     * the implementer
     * @param {Caveat} caveat - caveat to add to the macaroon
     * @returns {void}
     */
    addFirstPartyCaveat(caveat: Caveat): void;
    /**
     * @description Get a list of caveats from the base macaroon
     * @returns {Caveat[]} caveats - list of caveats
     */
    getCaveats(): Caveat[];
    /**
     * @description Converts the lsat into a valid LSAT token for use in an http
     * Authorization header. This will return a string in the form: "LSAT [macaroon]:[preimage?]".
     *  If no preimage is available the last character should be a colon, which would be
     * an "incomplete" LSAT
     * @returns {string}
     */
    toToken(): string;
    /**
     * @description Converts LSAT into a challenge header to return in the WWW-Authenticate response
     * header. Returns base64 encoded string with macaroon and invoice information prefixed with
     * authentication type ("LSAT")
     * @returns {string}
     */
    toChallenge(): string;
    toJSON(): LsatJson;
    addInvoice(invoice: string): void;
    /**
     * @description generates a new LSAT from an invoice and an optional invoice
     * @param {string} macaroon - macaroon to parse and generate relevant lsat properties from
     * @param {string} [invoice] - optional invoice which can provide other relevant information for the lsat
     */
    static fromMacaroon(macaroon: string, invoice?: string): Lsat;
    /**
     * @description Create an LSAT from an http Authorization header. A useful utility
     * when trying to parse an LSAT sent in a request and determining its validity
     * @param {string} token - LSAT token sent in request
     * @param {string} invoice - optional payment request information to intialize lsat with
     * @returns {Lsat}
     */
    static fromToken(token: string, invoice?: string): Lsat;
    /**
     * @description Validates and converts an LSAT challenge from a WWW-Authenticate header
     * response into an LSAT object. This method expects an invoice and a macaroon in the challenge
     * @param {string} challenge
     * @returns {Lsat}
     */
    static fromChallenge(challenge: string): Lsat;
    /**
     * @description Given an LSAT WWW-Authenticate challenge header (with token type, "LSAT", prefix)
     * will return an Lsat.
     * @param header
     */
    static fromHeader(header: string): Lsat;
}
export {};
