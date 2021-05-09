import { randomBytes } from 'crypto'

import { invoice } from './data'
import { Identifier } from '../src'
import { getIdFromRequest } from '../src/helpers'
import * as Macaroon from "macaroon";

export function getTestBuilder(secret: string) {
  const paymentHash = getIdFromRequest(invoice.payreq)

  const identifier = new Identifier({
    paymentHash: Buffer.from(paymentHash, 'hex'),
    tokenId: randomBytes(32),
  })
  const macaroon = Macaroon.newMacaroon({
    version: 1,
    rootKey: secret,
    identifier: identifier.toString(),
    location: 'location'
  });
  return macaroon
}
