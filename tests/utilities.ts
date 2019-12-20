import { parsePaymentRequest } from 'ln-service'
import { MacaroonsBuilder } from 'macaroons.js'
import { randomBytes } from 'crypto'

import { invoice } from './data'
import { Identifier } from '../src'

export class BuilderInterface extends MacaroonsBuilder {}
export function getTestBuilder(secret: string): BuilderInterface {
  const request = parsePaymentRequest({ request: invoice.payreq })

  const identifier = new Identifier({
    paymentHash: Buffer.from(request.id, 'hex'),
    tokenId: randomBytes(32),
  })
  const builder = new MacaroonsBuilder(
    'location',
    secret,
    identifier.toString()
  )
  return builder
}
