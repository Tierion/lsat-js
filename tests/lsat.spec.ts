import { expect } from 'chai'
import { parsePaymentRequest } from 'ln-service'

import { Caveat, Lsat } from '../src'

import { invoice } from './data'
import { getTestBuilder } from './utilities'

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
    const request = parsePaymentRequest({ request: invoice.payreq })

    paymentHash = request.id
    paymentPreimage = invoice.secret

    const builder = getTestBuilder('secret')
    macaroon = builder
      .add_first_party_caveat(caveat.encode())
      .getMacaroon()
      .serialize()

    challenge = `macaroon=${macaroon}, invoice=${invoice.payreq}`
    challenge = Buffer.from(challenge, 'utf8').toString('base64')
    challengeWithSpace = `macaroon=${macaroon} invoice=${invoice.payreq}`
    challengeWithSpace = Buffer.from(challengeWithSpace, 'utf8').toString(
      'base64'
    )
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
      Lsat.fromChallenge(`macaroon=${macaroon}`)
    const missingMacaroon = (): Lsat => Lsat.fromChallenge(`invoice=${invoice}`)

    expect(
      missingInvoice,
      'Should throw when challenge is missing invoice'
    ).to.throw()
    expect(
      missingMacaroon,
      'Should throw when challenge is missing macaroon'
    ).to.throw()
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
})
