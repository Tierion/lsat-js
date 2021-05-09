declare const bufio: any;
import { IdentifierOptions } from './types';
export declare const LATEST_VERSION = 0;
export declare const TOKEN_ID_SIZE = 32;
export declare class ErrUnknownVersion extends Error {
    constructor(version: number | string, ...params: any[]);
}
/**
 * @description An identifier encodes information about our LSAT that can be used as a unique identifier
 * and is used to generate a macaroon.
 * @extends Struct
 */
export declare class Identifier extends bufio.Struct {
    /**
     *
     * @param {Object} options - options to create a new Identifier
     * @param {number} version - version of the identifier used to determine encoding of the raw bytes
     * @param {Buffer} paymentHash - paymentHash of the invoice associated with the LSAT.
     * @param {Buffer} tokenId - random 32-byte id used to identify the LSAT by
     */
    constructor(options: IdentifierOptions | void);
    fromOptions(options: IdentifierOptions): this;
    /**
     * Convert identifier to string
     * @returns {string}
     */
    toString(): string;
    static fromString(str: string): Identifier;
    /**
     * Utility for encoding the Identifier into a buffer based on version
     * @param {bufio.BufferWriter} bw - Buffer writer for creating an Identifier Buffer
     * @returns {Identifier}
     */
    write(bw: any): this;
    /**
     * Utility for reading raw Identifier bytes and converting to a new Identifier
     * @param {bufio.BufferReader} br - Buffer Reader to read bytes
     * @returns {Identifier}
     */
    read(br: any): this;
}
export {};
