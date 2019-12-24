/**
 * @file Type definitions for types from 'macaroons.js' file
 */

/**
 * @typedef {Object} CaveatPacketInterface
 * @property {CaveatPacketType} type
 * @property {Buffer} rawValue
 * @property {string} valueAsText
 */
export interface CaveatPacketInterface {
  type: CaveatPacketType
  rawValue: Buffer
  valueAsText: string
  getRawValue: () => Buffer
  getValueAsText: () => string
}

export enum CaveatPacketType {
  location,
  identifier,
  signature,
  cid,
  vid,
  cl,
}

/**
 * @typedef {Object} MacaroonInterface
 * @property {string} location
 * @property {string} identifier
 * @property {string} signature
 * @property {Buffer} signatureBuffer
 * @property {CaveatPacketType[]} caveatPackets
 */
export interface MacaroonInterface {
  location: string
  identifier: string
  signature: string
  signatureBuffer: Buffer
  caveatPackets: CaveatPacketInterface[]
  serialize: () => string
  inspect: () => string
  createKeyValuePacket: (type: CaveatPacketType, value: string) => string
  createCaveatPackets: (caveats: CaveatPacketInterface[]) => string
}
