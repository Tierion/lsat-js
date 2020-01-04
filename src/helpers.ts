import { decode } from 'bolt11'
import assert from 'bsert'

/**
 * @description Given a string, determine if it is in hex encoding or not.
 * @param {string} h - string to evaluate
 */
export function isHex(h: string): boolean {
  return Buffer.from(h, 'hex').toString('hex') === h
}

export function getIdFromRequest(req: string): string {
    const request = decode(req)
    const hashTag = request.tags.find(tag => tag.tagName === 'payment_hash')
    assert(hashTag && hashTag.data, 'Could not find payment hash on invoice request')
    const paymentHash = hashTag?.data.toString()
    
    if (!paymentHash || !paymentHash.length) 
      throw new Error('Could not get payment hash from payment request')
    
      return paymentHash
}