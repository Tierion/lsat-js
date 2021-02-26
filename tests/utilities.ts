import { randomBytes } from 'crypto'

import { invoice } from './data'
import { Identifier } from '../src'
import { getIdFromRequest } from '../src/helpers'

export class BuilderInterface extends MacaroonsBuilder {}
export function getTestBuilder(secret: string): BuilderInterface {
  const paymentHash = getIdFromRequest(invoice.payreq)

  const identifier = new Identifier({
    paymentHash: Buffer.from(paymentHash, 'hex'),
    tokenId: randomBytes(32),
  })
  const builder = new MacaroonsBuilder(
    'location',
    secret,
    identifier.toString()
  )
  return builder
}
