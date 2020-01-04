const assert = require('bsert')
const bufio = require('bufio')

import crypto from 'crypto'
import { decode } from 'bolt11'
import { MacaroonsBuilder } from 'macaroons.js'

import { Caveat, Identifier } from '.'
import { LsatOptions, MacaroonInterface } from './types'
import { isHex, getIdFromRequest } from './helpers'

type LsatJson = {validUntil: number, isPending: boolean, isSatisfied: boolean} & LsatOptions
/**
 * @description A a class for creating and converting LSATs
 */
export class Lsat extends bufio.Struct {
  id: string
  baseMacaroon: string
  paymentHash: string
  paymentPreimage: string | null
  validUntil: number
  timeCreated: number
  invoice: string
  amountPaid: number | null
  routingFeePaid: number | null

  static type = 'LSAT'

  constructor(options: LsatOptions) {
    super(options)
    this.id = ''
    this.validUntil = 0
    this.invoice = ''
    this.baseMacaroon = ''
    this.paymentHash = Buffer.alloc(32).toString('hex')
    this.timeCreated = Date.now()
    this.paymentPreimage = null
    this.amountPaid = 0
    this.routingFeePaid = 0

    if (options) this.fromOptions(options)
  }

  fromOptions(options: LsatOptions): this {
    assert(
      typeof options.baseMacaroon === 'string',
      'Require serialized macaroon'
    )
    this.baseMacaroon = options.baseMacaroon

    assert(typeof options.id === 'string', 'Require string id')
    this.id = options.id

    assert(typeof options.paymentHash === 'string', 'Require paymentHash')
    this.paymentHash = options.paymentHash

    const expiration = this.getExpirationFromMacaroon(options.baseMacaroon)
    if (expiration) this.validUntil = expiration

    if (options.invoice) this.invoice = options.invoice

    if (options.timeCreated) this.timeCreated = options.timeCreated

    if (options.paymentPreimage) this.paymentPreimage = options.paymentPreimage

    if (options.amountPaid) this.amountPaid = options.amountPaid

    if (options.routingFeePaid) this.routingFeePaid = options.routingFeePaid

    return this
  }

  /**
   * @description Determine if the LSAT is expired or not. This is based on the
   * `validUntil` property of the lsat which is evaluated at creation time
   * based on the macaroon and any existing expiration caveats
   * @returns {boolean}
   */
  isExpired(): boolean {
    if (this.validUntil === 0) return false
    return this.validUntil < Date.now()
  }

  /**
   * @description Determines if the lsat is pending based on if it has a preimage
   * @returns {boolean}
   */
  isPending(): boolean {
    return this.paymentPreimage ? false : true
  }

  /**
   * @description Determines if the lsat is valid based on a valid preimage or not
   * @returns {boolean}
   */
  isSatisfied(): boolean {
    if (!this.paymentHash) return false
    if (!this.paymentPreimage) return false
    const hash = crypto
      .createHash('sha256')
      .update(Buffer.from(this.paymentPreimage, 'hex'))
      .digest('hex')
    if (hash !== this.paymentHash) return false
    return true
  }
  
  /**
   * @description Gets the base macaroon from the lsat
   * @returns {MacaroonInterface}
   */
  getMacaroon(): MacaroonInterface {
    return MacaroonsBuilder.deserialize(this.baseMacaroon)
  }

  /**
   * @description A utility for returning the expiration date of the LSAT's macaroon based on
   * an optional caveat
   * @param {string} [macaroon] - raw macaroon to get expiration date from if exists as a caveat. If
   * none is provided then it will use LSAT's base macaroon. Will throw if neither exists
   * @returns {number} expiration date
   */
  getExpirationFromMacaroon(macaroon?: string): number {
    if (!macaroon) macaroon = this.baseMacaroon
    assert(macaroon, 'Missing macaroon')

    const { caveatPackets } = MacaroonsBuilder.deserialize(macaroon)

    const expirationCaveats = []

    for (const { rawValue } of caveatPackets) {
      const caveat = Caveat.decode(rawValue.toString())
      if (caveat.condition === 'expiration') expirationCaveats.push(caveat)
    }

    // return zero if no expiration caveat
    if (!expirationCaveats.length) return 0

    // want to return the last expiration caveat
    return Number(expirationCaveats[expirationCaveats.length - 1].value)
  }

  /**
   * @description A utility for setting the preimage for an LSAT. This method will validate the preimage and throw
   * if it is either of the incorrect length or does not match the paymentHash
   * @param {string} preimage - 32-byte hex string of the preimage that is used as proof of payment of a lightning invoice
   */
  setPreimage(preimage: string): void {
    assert(
      isHex(preimage) && preimage.length === 64,
      'Must pass valid 32-byte hash for lsat secret'
    )

    const hash = crypto
      .createHash('sha256')
      .update(Buffer.from(preimage, 'hex'))
      .digest('hex')

    assert(
      hash === this.paymentHash,
      "Hash of preimage did not match LSAT's paymentHash"
    )
    this.paymentPreimage = preimage
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
  addFirstPartyCaveat(caveat: Caveat): void {
    assert(
      caveat instanceof Caveat,
      'Require a Caveat object to add to macaroon'
    )

    const macaroon = this.getMacaroon()
    const builder = MacaroonsBuilder.modify(macaroon)
    const newMac = builder
      .add_first_party_caveat(caveat.encode())
      .getMacaroon()
      .serialize()

    this.baseMacaroon = newMac
  }

  /**
   * @description Get a list of caveats from the base macaroon
   * @returns {Caveat[]} caveats - list of caveats
   */

  getCaveats(): Caveat[] {
    const caveats: Caveat[] = []
    const { caveatPackets } = this.getMacaroon()

    for (const { rawValue } of caveatPackets) {
      caveats.push(Caveat.decode(rawValue.toString()))
    }
    return caveats
  }
  /**
   * @description Converts the lsat into a valid LSAT token for use in an http
   * Authorization header. This will return a string in the form: "LSAT [macaroon]:[preimage?]".
   *  If no preimage is available the last character should be a colon, which would be
   * an "incomplete" LSAT
   * @returns {string}
   */
  toToken(): string {
    return `LSAT ${this.baseMacaroon}:${this.paymentPreimage || ''}`
  }

  /**
   * @description Converts LSAT into a challenge header to return in the WWW-Authenticate response
   * header. Returns base64 encoded string with macaroon and invoice information prefixed with
   * authentication type ("LSAT")
   * @returns {string}
   */
  toChallenge(): string {
    assert(
      this.invoice,
      `Can't create a challenge without a payment request/invoice`
    )
    const challenge = `macaroon=${this.baseMacaroon}, invoice=${this.invoice}`
    return `LSAT ${Buffer.from(challenge).toString('base64')}`
  }

  toJSON(): LsatJson {
    return {
      id: this.id,
      validUntil: this.validUntil,
      invoice: this.invoice,
      baseMacaroon: this.baseMacaroon,
      paymentHash: this.paymentHash,
      timeCreated: this.timeCreated,
      paymentPreimage: this.paymentPreimage || undefined, 
      amountPaid: this.amountPaid || undefined,
      routingFeePaid: this.routingFeePaid || undefined,
      isPending: this.isPending(),
      isSatisfied: this.isSatisfied()
    }
  }

  // Static API

  /**
   * @description generates a new LSAT from an invoice and an optional invoice
   * @param {string} macaroon - macaroon to parse and generate relevant lsat properties from
   * @param {string} [invoice] - optional invoice which can provide other relevant information for the lsat
   */
  static fromMacaroon(macaroon: string, invoice?: string): Lsat {
    const { identifier } = MacaroonsBuilder.deserialize(macaroon)
    let id: Identifier
    try {
      id = Identifier.fromString(identifier)
    } catch (e) {
      throw new Error(
        `Unexpected encoding for macaroon identifier: ${e.message}`
      )
    }

    const options: LsatOptions = {
      id: identifier,
      baseMacaroon: macaroon,
      paymentHash: id.paymentHash.toString('hex'),
    }

    if (invoice) {
      const invData = decode(invoice)
      const { satoshis: tokens } = invData
      const hashTag = invData.tags.find(tag => tag.tagName === 'payment_hash')
      assert(hashTag, 'Could not find payment hash on invoice request')
      const paymentHash = hashTag?.data

      assert(
        paymentHash === id.paymentHash.toString('hex'),
        'paymentHash from invoice did not match invoice'
      )
      options.amountPaid = tokens || undefined
      options.invoice = invoice
    }

    return new this(options)
  }

  /**
   * @description Create an LSAT from an http Authorization header. A useful utility
   * when trying to parse an LSAT sent in a request and determining its validity
   * @param {string} token - LSAT token sent in request
   * @param {string} invoice - optional payment request information to intialize lsat with
   * @returns {Lsat}
   */
  static fromToken(token: string, invoice?: string): Lsat {
    assert(token.includes(this.type), 'Token must include LSAT prefix')
    token = token.slice(this.type.length).trim()
    const [macaroon, preimage] = token.split(':')
    const lsat = Lsat.fromMacaroon(macaroon, invoice)

    if (preimage) lsat.setPreimage(preimage)
    return lsat
  }

  /**
   * @description Validates and converts an LSAT challenge from a WWW-Authenticate header
   * response into an LSAT object. This method expects an invoice and a macaroon in the challenge
   * @param {string} challenge
   * @returns {Lsat}
   */
  static fromChallenge(challenge: string): Lsat {
    // challenge should be in base64 encoding, so we need to convert it to utf8 first
    challenge = Buffer.from(challenge, 'base64').toString('utf8')
    const macChallenge = 'macaroon='
    const invoiceChallenge = 'invoice='

    let challenges: string[]

    challenges = challenge.split(',')

    // add support for challenges that are separated with just a space
    if (challenges.length < 2) challenges = challenge.split(' ')

    // if we still don't have at least two, then there was a malformed header/challenge
    assert(
      challenges.length >= 2,
      'Expected at least two challenges in the LSAT: invoice and macaroon'
    )

    let macaroon = '',
      invoice = ''

    // get the indexes of the challenge strings so that we can split them
    // kind of convoluted but it takes into account challenges being in the wrong order
    // and for excess challenges that we can ignore
    for (const c of challenges) {
      // check if we're looking at the macaroon challenge
      if (!macaroon.length && c.indexOf(macChallenge) > -1) {
        const split = c.split('=')
        assert(split.length === 2, 'Incorrectly encoded macaroon challenge')
        macaroon = split[split.length - 1].trim()
      }

      // check if we're looking at the invoice challenge
      if (!invoice.length && c.indexOf(invoiceChallenge) > -1) {
        const split = c.split('=')
        assert(split.length === 2, 'Incorrectly encoded invoice challenge')
        invoice = split[split.length - 1].trim()
      }
      // if there are other challenges but we have mac and invoice then we can break
      // as they are not LSAT relevant anyway
      if (invoice.length && macaroon.length) break
    }

    assert(
      invoice.length && macaroon.length,
      'Expected base64 encoded challenge with macaroon and invoice data'
    )
  
    const paymentHash = getIdFromRequest(invoice)

    const { identifier } = MacaroonsBuilder.deserialize(macaroon)

    return new this({
      id: identifier,
      baseMacaroon: macaroon,
      paymentHash,
      invoice: invoice,
    })
  }

  /**
   * @description Given an LSAT WWW-Authenticate challenge header (with token type, "LSAT", prefix)
   * will return an Lsat.
   * @param header
   */
  static fromHeader(header: string): Lsat {
    // remove the token type prefix to get the challenge
    const challenge = header.slice(this.type.length).trim()

    assert(
      header.length !== challenge.length,
      'header missing token type prefix "LSAT"'
    )

    return Lsat.fromChallenge(challenge)
  }
}
