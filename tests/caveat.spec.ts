import { expect } from 'chai'
import { MacaroonsBuilder } from 'macaroons.js'

import { Caveat, ErrInvalidCaveat, hasCaveat, verifyCaveats } from '../src'
import { Satisfier } from '../src/types'

describe('Caveats', () => {
  describe('Caveat', () => {
    it('should be able to encode a caveat for: =, <, >', () => {
      const caveats = [
        'expiration=1337',
        'time<1337',
        'time>1337',
        'expiration=1338=',
      ]

      caveats.forEach((c: string) => {
        const testCaveat = (): Caveat => Caveat.decode(c)
        expect(testCaveat).not.to.throw()
        const caveat = Caveat.decode(c)
        expect(caveat.encode()).to.equal(c)
      })
    })

    it('should trim whitespace from caveats', () => {
      const caveats = [
        { caveat: ' expiration = 1338', expected: 'expiration=1338' },
      ]

      caveats.forEach(c => {
        const testCaveat = (): Caveat => Caveat.decode(c.caveat)
        expect(testCaveat).not.to.throw()
        const caveat = Caveat.decode(c.caveat)
        expect(caveat.encode()).to.equal(c.expected)
      })
    })

    it('should throw if given an incorrectly encoded caveat', () => {
      const caveats = ['expiration:1337']

      caveats.forEach((c: string) => {
        const testCaveat = (): Caveat => Caveat.decode(c)
        expect(testCaveat).to.throw(ErrInvalidCaveat)
      })
    })
  })

  describe('hasCaveats', () => {
    it('should return the value for the last instance of a caveat with given condition on a macaroon', () => {
      const condition = 'expiration'
      const value = 100

      const caveat = new Caveat({ condition, value })

      let builder = new MacaroonsBuilder('location', 'secret', 'pubId')
      builder = builder.add_first_party_caveat(caveat.encode())
      let macaroon = builder.getMacaroon()
    
      // check that it returns the value for the caveat we're checking for
      expect(hasCaveat(macaroon.serialize(), caveat)).to.equal(
        caveat.value && caveat.value.toString()
      )

      // check that it will return false for a caveat that it doesn't have
      const fakeCaveat = new Caveat({ condition: 'foo', value: 'bar' })
      expect(hasCaveat(macaroon.serialize(), fakeCaveat)).to.be.false

      // check that it will return the value of a newer caveat with the same condition
      const newerCaveat = new Caveat({ condition, value: value - 1 })
      builder = builder.add_first_party_caveat(newerCaveat.encode())
      macaroon = builder.getMacaroon()

      expect(hasCaveat(macaroon.serialize(), newerCaveat)).to.equal(
        newerCaveat.value && newerCaveat.value.toString()
      )
    })

    it('should throw for an incorrectly encoded caveat', () => {
      const macaroon = new MacaroonsBuilder(
        'location',
        'secret',
        'pubId'
      ).getMacaroon()

      const test = (): boolean | ErrInvalidCaveat | string =>
        hasCaveat(macaroon.serialize(), 'condition:fail')

      expect(test).to.throw(ErrInvalidCaveat)
    })
  })

  describe('verifyCaveats', () => {
    let caveat1: Caveat,
      caveat2: Caveat,
      caveat3: Caveat,
      caveats: Caveat[],
      satisfier: Satisfier

    beforeEach(() => {
      caveat1 = new Caveat({ condition: '1', value: 'test' })
      caveat2 = new Caveat({ condition: '1', value: 'test2' })
      caveat3 = new Caveat({ condition: '3', value: 'foobar' })
      caveats = [caveat1, caveat2, caveat3]

      satisfier = {
        condition: caveat1.condition,
        // dummy satisfyPrevious function to test that it tests caveat lists correctly
        satisfyPrevious: (prev, cur): boolean =>
          prev.value.toString().includes('test') &&
          cur.value.toString().includes('test'),
        satisfyFinal: (): boolean => true,
      }
    })

    it('should verify caveats given a set of satisfiers', () => {
      const validatesCaveats = (): boolean | Error =>
        verifyCaveats(caveats, satisfier)

      expect(validatesCaveats).to.not.throw()
      expect(validatesCaveats()).to.be.true
    })

    it('should throw when satisfiers fail', () => {
      const invalidSatisfyFinal: Satisfier = {
        ...satisfier,
        satisfyFinal: (): boolean => false,
      }
      const invalidSatisfyPrev: Satisfier = {
        ...satisfier,
        // dummy satisfyPrevious function to test that it tests caveat lists correctly
        satisfyPrevious: (prev, cur): boolean =>
          prev.value.toString().includes('test') &&
          cur.value.toString().includes('foobar'),
      }
      const invalidSatisifers1 = [satisfier, invalidSatisfyFinal]
      const invalidSatisifers2 = [satisfier, invalidSatisfyPrev]
      const invalidateFinal = (): boolean =>
        verifyCaveats(caveats, invalidSatisifers1)
      const invalidatePrev = (): boolean =>
        verifyCaveats(caveats, invalidSatisifers2)

      expect(invalidateFinal()).to.be.false
      expect(invalidatePrev()).to.be.false
    })

    it('should be able to use an options object for verification', () => {
      const testCaveat = new Caveat({condition: 'middlename', value: 'danger'})
      caveats.push(testCaveat)
      satisfier = {
        condition: testCaveat.condition,
        // dummy satisfyPrevious function to test that it tests caveat lists correctly
        satisfyPrevious: (prev, cur, options): boolean =>
          prev.value.toString().includes('test') &&
          cur.value.toString().includes('test') && options.body.middlename === testCaveat.value,
        satisfyFinal: (caveat, options): boolean => {
          if (caveat.condition === testCaveat.condition && options?.body.middlename === testCaveat.value) 
            return true
          
          return false
        },
      }

      let isValid = verifyCaveats(caveats, satisfier, {body: { middlename: 'bob' }})
      
      expect(isValid, 'should fail when given an invalid options object').to.be.false
      
      isValid = verifyCaveats(caveats, satisfier, {body: { middlename: testCaveat.value }})

      expect(isValid, 'should pass when given a valid options object').to.be.true
    })
  })
})
