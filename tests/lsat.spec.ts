import { expect } from 'chai'

import * as Macaroon from 'macaroon'
import {
  Caveat,
  getRawMacaroon,
  Lsat,
  parseChallengePart,
} from '../src'
import {
  testChallengeParts,
  invoice,
  testChallenges,
  testChallengeErrors,
} from './data'
import { getTestBuilder } from './utilities'
import { decode } from '../src/helpers'

describe('parseChallengePart', () => {
  it('should handle macaroon with base64 padding', () => {
    for (const challenge of testChallengeParts) {
      expect(() => parseChallengePart(challenge.challenge)).not.to.throw()
      expect(parseChallengePart(challenge.challenge)).to.equal(
        challenge.expectedValue
      )
    }
  })
})

describe('LSAT Token', () => {
  let macaroon: string,
    paymentPreimage: string,
    expiration: number,
    challenge: string

  beforeEach(() => {
    expiration = Date.now() + 1000
    const caveat = new Caveat({ condition: 'expiration', value: expiration })

    paymentPreimage = invoice.secret

    const builder = getTestBuilder('secret')
    builder.addFirstPartyCaveat(caveat.encode())

    const macb64 = getRawMacaroon(builder)
    macaroon = macb64
    challenge = `macaroon="${macb64}", invoice="${invoice.payreq}"`
  })

  it('should be able to decode lsat challenges', () => {
    for (const {
      name,
      challenge,
      macaroon,
      paymentHash,
      expiration,
    } of testChallenges) {
      const fromChallenge = (): Lsat => Lsat.fromChallenge(challenge)

      expect(fromChallenge, `${name} should not have thrown`).to.not.throw()
      const lsat = fromChallenge()
      expect(lsat.baseMacaroon).to.equal(
        macaroon,
        `macaroon from ${name} LSAT did not match`
      )
      expect(lsat.paymentHash).to.equal(
        paymentHash,
        `paymentHash from ${name} LSAT did not match`
      )
      if (expiration)
        expect(lsat.validUntil).to.equal(
          expiration,
          `expiration from ${name} LSAT did not match`
        )
      else expect(lsat.validUntil).to.equal(0)
    }
  })

  it('should be able to decode header challenges', () => {
    for (const { name, challenge } of testChallenges) {
      const header = `LSAT ${challenge}`
      const fromHeader = (): Lsat => Lsat.fromHeader(header)
      expect(fromHeader, `${name} should not have thrown`).to.not.throw()
    }
  })

  it('should fail on incorrectly encoded challenges', () => {
    for (const { name, challenge, error } of testChallengeErrors) {
      const fromChallenge = (): Lsat => Lsat.fromChallenge(challenge)
      expect(fromChallenge, `${name} should not have thrown`).to.throw(error)
    }
  })

  it('should be able to check expiration to see if expired', () => {
    const lsat = Lsat.fromChallenge(challenge)
    expect(lsat.isExpired()).to.be.false
  })

  it('should check if payment is pending', () => {
    const lsat = Lsat.fromChallenge(challenge)

    expect(lsat).to.have.property('isPending')
    expect(lsat.isPending()).to.be.true
  })

  it('should be able to add valid preimage', () => {
    const lsat = Lsat.fromChallenge(challenge)

    const addWrongPreimage = (): void =>
      lsat.setPreimage(Buffer.alloc(32, 'a').toString('hex'))
    const addIncorrectLength = (): void => lsat.setPreimage('abcde12345')
    const addNonHex = (): void => lsat.setPreimage('xyzNMOP')
    expect(addWrongPreimage).to.throw('did not match')
    expect(addIncorrectLength).to.throw('32-byte hash')
    expect(addNonHex).to.throw('32-byte hash')

    const addSecret = (): void => lsat.setPreimage(paymentPreimage)
    expect(addSecret).to.not.throw()
    expect(lsat.paymentPreimage).to.equal(paymentPreimage)
  })

  it('should be able to return an LSAT token string', () => {
    const lsat = Lsat.fromChallenge(challenge)

    lsat.setPreimage(paymentPreimage)

    const expectedToken = `LSAT ${macaroon}:${paymentPreimage}`
    const token = lsat.toToken()

    expect(token).to.equal(expectedToken)
  })

  it('should be able to decode from token', () => {
    let token = `LSAT ${macaroon}:${paymentPreimage}`
    let lsat = Lsat.fromToken(token)
    expect(lsat.baseMacaroon).to.equal(macaroon)
    expect(lsat.paymentPreimage).to.equal(paymentPreimage)
    expect(lsat.toToken()).to.equal(token)

    // test with no secret
    token = `LSAT ${macaroon}:`
    lsat = Lsat.fromToken(token)
    expect(lsat.baseMacaroon).to.equal(macaroon)
    expect(!lsat.paymentPreimage).to.be.true
    expect(lsat.toToken()).to.equal(token)
  })

  it('should be able to add a first party caveat to the macaroon', () => {
    const lsat = Lsat.fromChallenge(challenge)
    const newCaveat = new Caveat({
      condition: 'expiration',
      value: expiration / 2,
    })

    const rawOriginal = lsat.baseMacaroon
    lsat.addFirstPartyCaveat(newCaveat)
    const rawMac = lsat.baseMacaroon

    expect(rawMac).to.not.equal(
      rawOriginal,
      "LSAT's base macaroon should be updated"
    )

    const originalMac = Macaroon.importMacaroon(rawOriginal)
    const mac = Macaroon.importMacaroon(rawMac)
    const originalcavs = originalMac._exportAsJSONObjectV2().c
    const cavs = mac._exportAsJSONObjectV2().c
    if (cavs == undefined || originalcavs == undefined) {
      return
    }
    expect(cavs.length).to.equal(
      originalcavs.length + 1,
      'new macaroon should have one more caveat than the original'
    )

    expect(lsat.getExpirationFromMacaroon()).to.equal(newCaveat.value)
  })

  it('should be able to return a list of caveats from the macaroon', () => {
    const lsat = Lsat.fromChallenge(challenge)

    const ogCount = lsat.getCaveats().length
    const firstCaveat = new Caveat({ condition: 'name', value: 'john snow' })
    const secondCaveat = new Caveat({
      condition: 'number',
      comp: '<',
      value: 4,
    })
    const newCaveats = [firstCaveat, secondCaveat]

    for (const c of newCaveats) {
      lsat.addFirstPartyCaveat(c)
    }

    let caveats = lsat.getCaveats()
    expect(caveats.length).to.equal(
      ogCount + newCaveats.length,
      `should have ${newCaveats.length} more caveats on base macaroon`
    )

    // test that the caveats match and are added in order
    for (let i = 0; i < newCaveats.length; i++) {
      caveats = caveats.slice(-newCaveats.length)
      expect(newCaveats[i].condition).to.equal(caveats[i].condition)
      expect(newCaveats[i].value == caveats[i].value).to.be.true
      expect(newCaveats[i].comp).to.equal(caveats[i].comp)
    }
  })

  it('should be able to determine if an LSAT is satisfied or not', () => {
    const lsat = Lsat.fromChallenge(challenge)
    expect(lsat.isSatisfied()).to.be.false
    lsat.paymentPreimage = '12345'
    expect(lsat.isSatisfied()).to.be.false
    lsat.setPreimage(paymentPreimage)
    expect(lsat.isSatisfied()).to.be.true
  })

  it('should be able to generate an LSAT from a macaroon and invoice', () => {
    let lsat = Lsat.fromMacaroon(macaroon)

    expect(lsat.baseMacaroon).to.equal(macaroon)

    lsat = Lsat.fromMacaroon(macaroon, invoice.payreq)
    expect(lsat.baseMacaroon).to.equal(macaroon)
    expect(lsat.invoice).to.equal(invoice.payreq)
    const invAmount = decode(invoice.payreq).satoshis || 0
    expect(lsat.invoiceAmount).to.equal(+invAmount)
  })

  it('should be able to add an invoice', () => {
    const lsat = Lsat.fromMacaroon(macaroon)
    const invAmount = decode(invoice.payreq).satoshis || 0

    lsat.addInvoice(invoice.payreq)

    expect(lsat.invoice).to.equal(invoice.payreq)
    expect(lsat.invoiceAmount).to.equal(invAmount)

    const addInvalidInv = (): void => lsat.addInvoice('12345')
    expect(addInvalidInv).to.throw()
  })

  it('test macaroon versions', () => {
    for (const { macaroon, name } of testChallenges) {
      const test = () => Lsat.fromMacaroon(macaroon)
      expect(test, `${name} should not have thrown`).to.not.throw()
    }
  })
})
