import { expect } from 'chai'
import * as Macaroon from 'macaroon'
import * as caveat from '../src/caveat'
import {
  Caveat,
  getCaveatsFromMacaroon,
  getRawMacaroon,
  MacaroonClass,
  Satisfier,
  verifyMacaroonCaveats,
} from '../src'
import sinon from 'sinon'

describe('macaroon', () => {
  let caveat1: Caveat,
    caveat2: Caveat,
    caveat3: Caveat,
    satisfier: Satisfier,
    mac: MacaroonClass,
    secret: string

  beforeEach(() => {
    caveat1 = new Caveat({ condition: '1', value: 'test' })
    caveat2 = new Caveat({ condition: '1', value: 'test2' })
    caveat3 = new Caveat({ condition: '3', value: 'foobar' })

    satisfier = {
      condition: caveat1.condition,
      // dummy satisfyPrevious function to test that it tests caveat lists correctly
      satisfyPrevious: (prev, cur): boolean =>
        prev.value.toString().includes('test') &&
        cur.value.toString().includes('test'),
      satisfyFinal: (): boolean => true,
    }
    secret = 'secret'
    mac = Macaroon.newMacaroon({
      version: 1,
      rootKey: secret,
      identifier: 'pubId',
      location: 'location',
    })
  })

  describe('getCaveatsFromMacaroon', () => {
    it('should correctly return all caveats from raw macaroon', () => {
      const testCaveats = [caveat1, caveat2, caveat3]
      testCaveats.forEach(c => mac.addFirstPartyCaveat(c.encode()))
      const raw = getRawMacaroon(mac)
      const caveats = getCaveatsFromMacaroon(raw)
      expect(caveats).to.have.lengthOf(testCaveats.length)
    })

    it('should return empty array if no caveats', () => {
      const raw = getRawMacaroon(mac)
      const caveats = getCaveatsFromMacaroon(raw)
      expect(caveats).to.have.lengthOf(0)
    })
  })

  describe('verifyMacaroonCaveats', () => {
    it('should verify the signature on a macaroon w/ no caveats', () => {
      const isValid = verifyMacaroonCaveats(
        getRawMacaroon(mac),
        secret,
        satisfier
      )
      expect(isValid).to.be.true
    })

    it('should run verifyCaveats with all caveats and satisfiers', () => {
      const testCaveats = [caveat1, caveat2]
      testCaveats.forEach(c => mac.addFirstPartyCaveat(c.encode()))
      const spy = sinon.spy(caveat, 'verifyCaveats')
      const isValid = verifyMacaroonCaveats(
        getRawMacaroon(mac),
        secret,
        satisfier
      )
      expect(isValid).to.be.true
      expect(spy.calledWithMatch(testCaveats, [satisfier])).to.be.true
    })

    it('should return false if caveats dont verify', () => {
      satisfier.satisfyFinal = (): boolean => false
      mac.addFirstPartyCaveat(caveat1.encode())
      mac.addFirstPartyCaveat(caveat2.encode())
      const isValid = verifyMacaroonCaveats(
        getRawMacaroon(mac),
        secret,
        satisfier
      )
      expect(isValid).to.be.false
    })
  })

  describe('getRawMacaroon', () => {
    it('should convert a macaroon to base64', () => {
      // built-in Macaroon function doesn't handle slashes properly
      // so want to test with one that has them
      const original =
        'AgEEbHNhdAJCAACpIed4t8z8YTUNlAsUMqi1cYNA0kTYT6ajy0FpYySS/c/Lpm7rxB1Qyskte0aSEf3Ze2buI3yl2wmZtVgMZjzVAAIWc2VydmljZXM9c3BoaW54X21lbWU6MAACJXNwaGlueF9tZW1lX2NhcGFiaWxpdGllcz1sYXJnZV91cGxvYWQAAhZsYXJnZV91cGxvYWRfbWF4X21iPTMyAAAGIEFPRpVD8ryeKlJsfMvtufUogBiUwvz/h9KP/FC6gHg8'
      
      const mac = Macaroon.importMacaroon(original)
      expect(getRawMacaroon(mac)).to.equal(original)
    })
  })
})
