import { Caveat } from '../caveat'

/**
 * @typedef {function (prev: Caveat, curr: Caveat, options: object): boolean} SatisfyPrevious
 * @description A satisfier function for comparing two caveats to ensure increasing restrictiveness.
 * @param {Caveat} prev - preceding caveat
 * @param {Caveat} curr - current caveat
 * @param {Object} options - optional object to be used to make evaluation, e.g. a request object in a server
 * @returns {boolean}
 */
export type SatisfyPrevious = (
  prev: Caveat,
  curr: Caveat,
  options?: any
) => boolean

/**
 * @typedef {function (caveat: Caveat, options: object): boolean} SatisfyFinal
 * @description A satisfier function to evaluate if a caveat has been satisfied
 * @param {Caveat} caveat - caveat to evaluate
 * @param {Object} options - optional object to be used to make evaluation, e.g. a request object in a server
 * @returns boolean
 */
export type SatisfyFinal = (caveat: Caveat, options?: any) => boolean

/**
 * @typedef {Object} Satisfier
 * @description Satisfier provides a generic interface to satisfy a caveat based on its
 * condition.
 * @property {string} condition - used to identify the caveat to check against
 * @property {SatisfyPrevious} satisfyPrevious
 * @property {SatisfyFinal} satisfyFinal
 */
export interface Satisfier {
  condition: string
  satisfyPrevious?: SatisfyPrevious
  satisfyFinal: SatisfyFinal
}
