import { expect } from 'chai'

import { MacaroonsBuilder } from 'macaroons.js'

import { Caveat, Lsat } from '../src'
import { invoice } from './data'
import { getTestBuilder } from './utilities'
import { getIdFromRequest, decode } from '../src/helpers'

describe('LSAT Token', () => {
  let macaroon: string,
    paymentHash: string,
    paymentPreimage: string,
    expiration: number,
    challenge: string,
    challengeWithSpace: string

  beforeEach(() => {
    expiration = Date.now() + 1000
    const caveat = new Caveat({ condition: 'expiration', value: expiration })
    paymentHash = getIdFromRequest(invoice.payreq)

    paymentPreimage = invoice.secret

    const builder = getTestBuilder('secret')
    macaroon = builder
      .add_first_party_caveat(caveat.encode())
      .getMacaroon()
      .serialize()

    challenge = `macaroon="${macaroon}", invoice="${invoice.payreq}"`
    challengeWithSpace = `macaroon="${macaroon}" invoice="${invoice.payreq}"`
  })

  it('should be able to decode from challenge and from header', () => {
    const header = `LSAT ${challenge}`

    const fromChallenge = (): Lsat => Lsat.fromChallenge(challenge)
    const fromChallengeWithSpace = (): Lsat =>
      Lsat.fromChallenge(challengeWithSpace)
    const fromHeader = (): Lsat => Lsat.fromHeader(header)

    const tests = [
      {
        name: 'fromChallenge',
        test: fromChallenge,
      },
      {
        name: 'fromChallengeWithSpace',
        test: fromChallengeWithSpace,
      },
      {
        name: 'fromHeader',
        test: fromHeader,
      },
    ]
    for (const { name, test } of tests) {
      expect(test, `${name} should not have thrown`).to.not.throw()
      const lsat = test()

      expect(lsat.baseMacaroon).to.equal(
        macaroon,
        `macaroon from ${name} LSAT did not match`
      )
      expect(lsat.paymentHash).to.equal(
        paymentHash,
        `paymentHash from ${name} LSAT did not match`
      )
      expect(lsat.validUntil).to.equal(
        expiration,
        `expiration from ${name} LSAT did not match`
      )
    }

    const missingInvoice = (): Lsat =>
      Lsat.fromChallenge(`macaroon="${macaroon}"`)
    const missingMacaroon = (): Lsat =>
      Lsat.fromChallenge(`invoice="${invoice}"`)

    expect(
      missingInvoice,
      'Should throw when challenge is missing invoice'
    ).to.throw()
    expect(
      missingMacaroon,
      'Should throw when challenge is missing macaroon'
    ).to.throw()
  })

  it('should throw fromChallenge if challenge is incorrectly encoded', () => {
    const { payreq } = invoice
    const incorrectEncodings = [
      {
        challenge: `macaroon=${macaroon}, invoice="${payreq}"`,
        name: 'macaroon not in double quotes',
      },
      {
        challenge: `macaroon="${macaroon}" invoice=${payreq}`,
        name: 'invoice not in double quotes',
      },
      {
        challenge: `macaroon=${macaroon} invoice=${payreq}`,
        name: 'neither part in double quotes',
      },
      {
        challenge: `macaroon="${macaroon}"`,
        name: 'missing invoice',
      },
      {
        challenge: `invoice="${payreq}"`,
        name: 'missing macaroon',
      },
    ]

    for (const c of incorrectEncodings) {
      const test = (): Lsat => Lsat.fromChallenge(c.challenge)
      expect(test, `Should have thrown an error with ${c.name}`).to.throw()
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

    const originalMac = MacaroonsBuilder.deserialize(rawOriginal)
    const mac = MacaroonsBuilder.deserialize(rawMac)

    expect(mac.caveatPackets.length).to.equal(
      originalMac.caveatPackets.length + 1,
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
})
