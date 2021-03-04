/// <reference types="node" />
/**
 * @typedef {Object} IdentifierOptions
 * @property {number} version - version of the Identifier. Used for serialization
 * @property {Buffer} paymentHash - payment hash of invoice associated with LSAT
 * @property {Buffer} tokenId - unique identifier for the LSAT
 * Describes the shape of the options for creating a new identifier struct
 * which represents the constant, unique identifiers associated with a macaroon
 */
export interface IdentifierOptions {
    version?: number;
    paymentHash: Buffer;
    tokenId?: Buffer;
}
/**
 * @typedef {Object} CaveatOptions
 * @property {string} condition - the key used to identify the caveat
 * @property {string|number} value - value for the caveat to be compared against
 * @property {string} comp - a comparator string for how the value should be evaluated
 * Describes options to create a caveat. The condition is like the variable
 * and the value is what it is expected to be. Encoded format would be "condition=value"
 */
export interface CaveatOptions {
    condition: string;
    value: string | number;
    comp?: string;
}
/**
 * @typedef LsatOptions
 * Describes options to create an LSAT token.
 */
export interface LsatOptions {
    id: string;
    baseMacaroon: string;
    paymentHash: string;
    invoice?: string;
    timeCreated?: number;
    paymentPreimage?: string;
    amountPaid?: number;
    routingFeePaid?: number;
}
