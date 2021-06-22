import { Caveat, verifyCaveats } from "./caveat";
import { stringToBytes } from './helpers'
import * as Macaroon from 'macaroon'
import { MacaroonClass, Satisfier } from "./types";

/**
 * @description utility function to get an array of caveat instances from
 * a raw macaroon.
 * @param {string} macaroon - raw macaroon to retrieve caveats from
 * @returns {Caveat[]} array of caveats on the macaroon
 */
export function getCaveatsFromMacaroon(rawMac: string): Caveat[] {
  const macaroon = Macaroon.importMacaroon(rawMac)
  const caveats = []
  const rawCaveats = macaroon._exportAsJSONObjectV2()?.c

  if (rawCaveats) {
    for (const c of rawCaveats) {
      if (!c.i) continue;
      const caveat = Caveat.decode(c.i)
      caveats.push(caveat)
    }
  }
  return caveats
} 

/**
 * @description verifyMacaroonCaveats will check if a macaroon is valid or
 * not based on a set of satisfiers to pass as general caveat verifiers. This will also run
 * against caveat.verifyCaveats to ensure that satisfyPrevious will validate
 * @param {string} macaroon A raw macaroon to run a verifier against
 * @param {String} secret The secret key used to sign the macaroon
 * @param {(Satisfier | Satisfier[])} satisfiers a single satisfier or list of satisfiers used to verify caveats
 * @param {Object} [options] An optional options object that will be passed to the satisfiers.
 * In many circumstances this will be a request object, for example when this is used in a server
 * @returns {boolean}
 */
export function verifyMacaroonCaveats(
  rawMac: string,
  secret: string,
  satisfiers?: Satisfier | Satisfier[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any = {}
): boolean {
  try {
    const macaroon = Macaroon.importMacaroon(rawMac)
    const secretBytesArray = stringToBytes(secret)

    // js-macaroon's verification takes a function as its second
    // arg that runs a check against each caveat which is a less full-featured
    // version of `verifyCaveats` used below since it doesn't support contextual
    // checks like comparing w/ previous caveats for the same condition.
    // we pass this stubbed function so signature checks can be done
    // and satisfier checks will be done next if this passes.
    macaroon.verify(secretBytesArray, () => null)

    const caveats = getCaveatsFromMacaroon(rawMac)
    if (!caveats.length) return true;
    // check caveats against satisfiers, including previous caveat checks
    return verifyCaveats(caveats, satisfiers, options)
  } catch (e) {
    return false
  }
}

export function getRawMacaroon(mac: MacaroonClass): string {
  return Macaroon.bytesToBase64(mac._exportBinaryV2())
}
