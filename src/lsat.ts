const assert = require('bsert')
const bufio = require('bufio')

import crypto from 'crypto'
import * as Macaroon from 'macaroon'

import { Caveat, Identifier } from '.'
import { LsatOptions } from './types'
import { isHex, getIdFromRequest, decode } from './helpers'

type LsatJson = {
  validUntil: number, 
  isPending: boolean, 
  isSatisfied: boolean, 
  invoiceAmount: number
} & LsatOptions

/** Helpers */

export function parseChallengePart(challenge:string): string {
  let macaroon     
  const separatorIndex = challenge.indexOf('=')
  assert(separatorIndex > -1, 'Incorrectly encoded macaroon challenge. Missing "=" separator.')
  
  // slice off `[challengeType]=`
  const splitIndex = challenge.length - 1 - separatorIndex;
  macaroon = challenge.slice(-splitIndex)
  assert(macaroon.length, 'Incorrectly encoded macaroon challenge')

  assert(
    macaroon[0] === '"' && macaroon[macaroon.length -1] === '"', 
    'Incorecctly encoded macaroon challenge, must be enclosed in double quotes.'
  )
  macaroon = macaroon.slice(1, macaroon.length - 1)
  return macaroon
}

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
  invoiceAmount: number

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
    this.invoiceAmount = 0

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

    if (options.invoice) {
      this.addInvoice(options.invoice)
    }

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
  getMacaroon(): Macaroon.MacaroonJSONV2 {
    return Macaroon.importMacaroon(this.baseMacaroon)._exportAsJSONObjectV2()
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

    const caveatPackets = Macaroon.importMacaroon(macaroon)._exportAsJSONObjectV2().c
    const expirationCaveats = []
    if (caveatPackets == undefined) {
      return 0
    }
    for (const cav of caveatPackets) {
      if (cav.i == undefined) {
        continue
      }
      const caveat = Caveat.decode(cav.i)
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

    const mac = Macaroon.importMacaroon(this.baseMacaroon)
    mac.addFirstPartyCaveat(caveat.encode())
    this.baseMacaroon = Macaroon.bytesToBase64(mac._exportBinaryV2())
  }

  /**
   * @description Get a list of caveats from the base macaroon
   * @returns {Caveat[]} caveats - list of caveats
   */

  getCaveats(): Caveat[] {
    const caveats: Caveat[] = []
    const caveatPackets = this.getMacaroon().c
    if (caveatPackets == undefined){
      return caveats
    }
    for (const cav of caveatPackets) {
      if (cav.i == undefined) {
        continue
      }
      caveats.push(Caveat.decode(cav.i))
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
    const challenge = `macaroon="${this.baseMacaroon}", invoice="${this.invoice}"`
    return `LSAT ${challenge}`
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
      invoiceAmount: this.invoiceAmount,
      routingFeePaid: this.routingFeePaid || undefined,
      isPending: this.isPending(),
      isSatisfied: this.isSatisfied()
    }
  }

  addInvoice(invoice: string): void {
    assert(this.paymentHash, 'Cannot add invoice data to an LSAT without paymentHash')
      try {
        type Tag = {tagName: string, data?: string}
        const data = decode(invoice)
        const { satoshis: tokens } = data
        const hashTag = data.tags.find((tag: Tag) => tag.tagName === 'payment_hash')
        assert(hashTag, 'Could not find payment hash on invoice request')
        const paymentHash = hashTag?.data
  
        assert(
          paymentHash === this.paymentHash,
          'paymentHash from invoice did not match LSAT'
        )
        this.invoiceAmount = tokens || 0
        this.invoice = invoice
      } catch (e) {
        throw new Error(`Problem adding invoice data to LSAT: ${e.message}`)
      }
  }
  // Static API

  /**
   * @description generates a new LSAT from an invoice and an optional invoice
   * @param {string} macaroon - macaroon to parse and generate relevant lsat properties from
   * @param {string} [invoice] - optional invoice which can provide other relevant information for the lsat
   */
  static fromMacaroon(macaroon: string, invoice?: string): Lsat {
    assert(typeof macaroon === 'string', 'Requires a raw macaroon string for macaroon to generate LSAT')
    const identifier = Macaroon.importMacaroon(macaroon)._exportAsJSONObjectV2().i
    let id: Identifier
    try {
      if (identifier == undefined) {
        throw new Error(
            `macaroon identifier undefined`
        )
      }
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
    const lsat = new this(options)
    
    if (invoice) {
      lsat.addInvoice(invoice)
    }

    return lsat
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
        try {
          macaroon = parseChallengePart(c)
        } catch (e) {
          throw new Error(`Problem parsing macaroon challenge: ${e.message}`)
        }
      }

      // check if we're looking at the invoice challenge
      if (!invoice.length && c.indexOf(invoiceChallenge) > -1) {
        try {
          invoice = parseChallengePart(c)
        } catch (e) {
          throw new Error(`Problem parsing macaroon challenge: ${e.message}`)
        }
      }
      // if there are other challenges but we have mac and invoice then we can break
      // as they are not LSAT relevant anyway
      if (invoice.length && macaroon.length) break
    }

    assert(
      invoice.length && macaroon.length,
      'Expected WWW-Authenticate challenge with macaroon and invoice data'
    )
  
    const paymentHash = getIdFromRequest(invoice)

    const identifier = Macaroon.importMacaroon(macaroon)._exportAsJSONObjectV2().i
    if (identifier == undefined){
      throw new Error(`Problem parsing macaroon identifier`)
    }

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