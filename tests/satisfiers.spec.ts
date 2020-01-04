import { expect } from 'chai'
import { Caveat, expirationSatisfier, verifyCaveats } from '../src'
import { Satisfier } from '../src/types'

describe('satisfiers', () => {
  describe('expirationSatisfier', () => {
    let satisfier: Satisfier

    beforeEach(() => {
      satisfier = expirationSatisfier
    })
    it('should validate expiration caveat', () => {
      const validCaveat = new Caveat({
        condition: 'expiration',
        value: Date.now() + 1000,
      })
      const expectValid = satisfier.satisfyFinal(validCaveat)
      const expired = new Caveat({
        condition: 'expiration',
        value: Date.now() - 100,
      })
      const expectFailed = satisfier.satisfyFinal(expired)

      expect(validCaveat.condition).to.equal(satisfier.condition)
      expect(expectValid, 'Valid caveat should have been satisfied').to.be.true
      expect(expired.condition).to.equal(satisfier.condition)
      expect(expectFailed, 'expired caveat should be invalid').to.be.false
    })

    it('should only satisfy caveats that get more restrictive', () => {
      const interval = 1000
      const condition = 'expiration'
      const firstCaveat = new Caveat({
        condition,
        value: Date.now() + interval,
      })
      const secondCaveat = new Caveat({
        condition,
        value: Date.now() + interval / 2, // more restrictive time
      })
      const expectValid = verifyCaveats([firstCaveat, secondCaveat], satisfier)
      const expectFailed = verifyCaveats([secondCaveat, firstCaveat], satisfier)

      expect(satisfier).to.have.property('satisfyPrevious')
      expect(
        expectValid,
        'Expected caveats w/ increasing restrictiveness to pass'
      ).to.be.true
      expect(
        expectFailed,
        'Expected caveats w/ decreasingly restrictive expirations to fail'
      ).to.be.false
    })
  })
})
