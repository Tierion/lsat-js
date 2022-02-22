import { randomBytes } from 'crypto'
import { expect } from 'chai'

import {
  Identifier,
  LATEST_VERSION,
  TOKEN_ID_SIZE,
  ErrUnknownVersion,
  decodeIdentifierFromMacaroon,
} from '../src'
import { testChallenges } from './data'

describe('Macaroon Identifier', () => {
  it('should properly serialize identifier of known version', () => {
    const options = {
      version: LATEST_VERSION,
      paymentHash: randomBytes(32),
      tokenId: randomBytes(TOKEN_ID_SIZE),
    }

    const identifier = new Identifier(options)
    const encodeId = (): Buffer => identifier.encode()
    expect(encodeId).to.not.throw()
    const decoded = Identifier.decode(identifier.encode())
    expect(decoded).to.deep.equal(options)
  })

  it('should fail for unknown identifier version', () => {
    const options = {
      version: LATEST_VERSION + 1,
      paymentHash: randomBytes(32),
      tokenId: randomBytes(TOKEN_ID_SIZE),
    }

    const encodeId = (): Identifier => new Identifier(options)
    expect(encodeId).to.throw(ErrUnknownVersion, options.version.toString())
  })

  it('can decode from different macaroon types', () => {
    for (const { macaroon } of testChallenges) {
      const id = decodeIdentifierFromMacaroon(macaroon)
      Identifier.fromString(id)
    }
  })
})
