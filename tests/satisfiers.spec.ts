import { expect } from 'chai'
import {
  Caveat,
  expirationSatisfier,
  verifyCaveats,
  SERVICES_CAVEAT_CONDITION,
  InvalidServicesError,
  createServicesSatisfier,
  SERVICE_CAPABILITIES_SUFFIX,
  createCapabilitiesSatisfier,
  InvalidCapabilitiesError,
} from '../src'
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

  describe('services satisfier', () => {
    let firstCaveat: Caveat, secondCaveat: Caveat

    beforeEach(() => {
      firstCaveat = Caveat.decode(`${SERVICES_CAVEAT_CONDITION}=foo:0,bar:1`)
      secondCaveat = Caveat.decode(`${SERVICES_CAVEAT_CONDITION}=foo:1,bar:1`)
    })

    const runTest = (
      caveats: Caveat[],
      targetService: string
    ): boolean | Error => {
      const satisfier = createServicesSatisfier(targetService)
      return verifyCaveats(caveats, satisfier)
    }

    it('should fail to create satisfier on invalid target service', () => {
      const invalidTargetServices = [12, { foo: 'bar' }, ['a', 'b', 'c']]
      for (const target of invalidTargetServices) {
        // @ts-expect-error this is a test that we expect to throw
        expect(() => createServicesSatisfier(target)).to.throw(
          InvalidServicesError
        )
      }
    })

    it('should throw InvalidServicesError if caveats are incorrect', () => {
      const invalidCaveatValue = Caveat.decode(
        `${SERVICES_CAVEAT_CONDITION}=noTier`
      )

      expect(
        () => runTest([invalidCaveatValue, firstCaveat], 'foo'),
        'invalid caveat value'
      ).to.throw(InvalidServicesError)
      expect(
        () => runTest([firstCaveat, invalidCaveatValue], 'foo'),
        'invalid caveat value'
      ).to.throw(InvalidServicesError)
    })

    it('should not allow any services that were not previously allowed', () => {
      const invalidCaveat = Caveat.decode(`${SERVICES_CAVEAT_CONDITION}=baz:0`)
      const caveats = [firstCaveat, invalidCaveat]
      expect(runTest(caveats, 'foo')).to.be.false
    })

    it('should validate only increasingly restrictive (higher) service tiers', () => {
      // order matters
      const caveats = [secondCaveat, firstCaveat]
      expect(runTest(caveats, 'foo')).to.be.false
    })

    it('should validate for the specified target service', () => {
      const caveats = [firstCaveat, secondCaveat]
      expect(runTest(caveats, 'foo')).to.be.true
      expect(runTest(caveats, 'baz')).to.be.false
    })
  })

  describe('capabilities satisfier', () => {
    let firstCaveat: Caveat, secondCaveat: Caveat
    const service = 'lightning'

    beforeEach(() => {
      firstCaveat = Caveat.decode(
        `${service}${SERVICE_CAPABILITIES_SUFFIX}=read,write`
      )
      secondCaveat = Caveat.decode(
        `${service}${SERVICE_CAPABILITIES_SUFFIX}=read`
      )
    })

    const runTest = (
      caveats: Caveat[],
      targetCapability: string
    ): boolean | Error => {
      const satisfier = createCapabilitiesSatisfier(service, targetCapability)
      return verifyCaveats(caveats, satisfier)
    }

    it('should fail to create satisfier on invalid inputs', () => {
      const invalidInputs = [12, { foo: 'bar' }, ['a', 'b', 'c']]
      for (const target of invalidInputs) {
        // @ts-expect-error test that expects to throw
        expect(() => createCapabilitiesSatisfier(target, 'test')).to.throw(
          InvalidCapabilitiesError
        )
        // @ts-expect-error test that expects to throw
        expect(() => createCapabilitiesSatisfier('test', target)).to.throw(
          InvalidCapabilitiesError
        )
      }
    })

    it('should not allow any capabilities that were not previously allowed', () => {
      const caveats = [secondCaveat, firstCaveat]
      expect(runTest(caveats, 'foo')).to.be.false
    })

    it('should validate for the specified target capabilities', () => {
      const caveats = [firstCaveat, secondCaveat]
      expect(runTest(caveats, 'read')).to.be.true
      // second caveat only has read which is an attenuation with restricted permissions
      // so doesn't have write
      expect(runTest(caveats, 'write')).to.be.false
      // only the first caveat means it has both read and write
      expect(runTest([firstCaveat], 'write')).to.be.true
    })
  })
})
