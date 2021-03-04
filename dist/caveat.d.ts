import { CaveatOptions, Satisfier } from './types';
/**
 * @description Creates a new error describing a problem with creating a new caveat
 * @extends Error
 */
export declare class ErrInvalidCaveat extends Error {
    constructor(...params: any[]);
}
/**
 * @typedef {Object} Caveat
 * @description A caveat is a class with a condition, value and a comparator. They
 * are used in macaroons to evaluate the validity of a macaroon. The Caveat class
 * provides a method for turning a string into a caveat object (decode) and a way to
 * turn a caveat into a string that can be encoded into a macaroon.
 */
export declare class Caveat {
    condition: string;
    value: string | number;
    comp: string;
    /**
     * Create a caveat
     * @param {Object} options - options to create a caveat from
     * @param {string} options.condition - condition that will be evaluated, e.g. "expiration", "ip", etc.
     * @param {string} options.value - the value that the caveat should equal. When added to a macaroon this is what
     * the request is evaluated against.
     * @param {string} [comp="="] - one of "=", "<", ">" which describes how the value is compared. So "time<1576799124987"
     * would mean we will evaluate a time that is less than "1576799124987"
     */
    constructor(options: CaveatOptions);
    fromOptions(options: CaveatOptions): this;
    /**
     * @returns {string} Caveat as string value. e.g. `expiration=1576799124987`
     */
    encode(): string;
    /**
     *
     * @param {string} c - create a new caveat from a string
     * @returns {Caveat}
     */
    static decode(c: string): Caveat;
}
/**
 * @description hasCaveat will take a macaroon and a caveat and evaluate whether or not
 * that caveat exists on the macaroon
 * @param {string} rawMac - raw macaroon to determine caveats from
 * @param {Caveat|string} c - Caveat to test against macaroon
 * @returns {boolean}
 */
export declare function hasCaveat(rawMac: string, c: Caveat | string): string | boolean | ErrInvalidCaveat;
/**
 * @description A function that verifies the caveats on a macaroon.
 * The functionality mimics that of loop's lsat utilities.
 * @param caveats a list of caveats to verify
 * @param {Satisfier} satisfiers a single satisfier or list of satisfiers used to verify caveats
 * @param {Object} [options] An optional options object that will be passed to the satisfiers.
 * In many circumstances this will be a request object, for example when this is used in a server
 * @returns {boolean}
 */
export declare function verifyCaveats(caveats: Caveat[], satisfiers: Satisfier | Satisfier[], options?: object): boolean;
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
export declare function verifyFirstPartyMacaroon(rawMac: string, secret: string, satisfiers?: Satisfier | Satisfier[], options?: any): boolean;
