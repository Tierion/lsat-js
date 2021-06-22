import { MacaroonJSONV2 } from 'macaroon'

export * from './lsat'
export * from './satisfier'

// js-macaroon doesn't export a type for its base class
// this throws off some of the ts linting when it wants a return type
/**
 * @typedef {Object} MacaroonClass
 */
export interface MacaroonClass {
  _exportAsJSONObjectV2(): MacaroonJSONV2
  addFirstPartyCaveat(caveatIdBytes: Uint8Array | string): void
  _exportBinaryV2(): Uint8Array
}

// could maybe do the above as -> typeof Macaroon.newMacaroon({...})
