import {expect} from 'chai'
import {NoServicesError, InvalidServicesError, decodeServicesCaveat, Service, encodeServicesCaveatValue} from '../src/service'

describe.only('services', () => {
  it('can encode and decode service caveats', () => {
    const tests = [
      {
        name: 'single service',
        value: 'a:0',
      },
      {
        name: 'multiple services',
        value: 'a:0,b:1,c:0',
      },
      {
        name: 'multiple services with spaces',
        value: 'a:0, b:1, c:0',
      },
      {
        name: 'no services',
        value: '',
        err: NoServicesError,
      },
      {
        name: 'service missing name',
        value: ':0',
        err: InvalidServicesError,
      },
      {
        name: 'service missing tier',
        value: 'a',
        err: InvalidServicesError,
      },
      {
        name: 'service empty tier',
        value: 'a:',
        err: InvalidServicesError,
      },
      {
        name: 'service non-numeric tier',
        value: 'a:b',
        err: InvalidServicesError,
      },
      {
        name: 'service non-string service name',
        value: '1:1',
        err: InvalidServicesError,
      },
      {
        name: 'empty services',
        value: ',,',
        err: InvalidServicesError,
      },
    ]

    for (const t of tests) {
      if (t.err) {
        expect(
          () => decodeServicesCaveat(t.value),
          `"${t.name}" did not throw expected error`
        ).to.throw(t.err)
        continue
      }
      
      const services = decodeServicesCaveat(t.value)
      // check to make typescript happy
      if (!(services instanceof Error)) {
        const rawServices = encodeServicesCaveatValue(services)
        expect(rawServices).to.equal(t.value)
      }
    }
  })
})