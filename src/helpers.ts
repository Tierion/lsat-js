/**
 * @description Given a string, determine if it is in hex encoding or not.
 * @param {string} h - string to evaluate
 */
export function isHex(h: string): boolean {
  return Buffer.from(h, 'hex').toString('hex') === h
}
