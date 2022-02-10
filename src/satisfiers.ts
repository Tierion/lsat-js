/**
 * @file Useful satisfiers that are independent of environment, for example,
 * ones that don't require the request object in a server as these can be used anywhere.
 */

import {
  Satisfier,
  Caveat,
  InvalidServicesError,
  SERVICES_CAVEAT_CONDITION,
  decodeServicesCaveat,
  InvalidCapabilitiesError,
  SERVICE_CAPABILITIES_SUFFIX,
  decodeCapabilitiesValue,
} from '.'

/**
 * @description A satisfier for validating expiration caveats on macaroon. Used in the exported
 * boltwallConfig TIME_CAVEAT_CONFIGS
 * @type Satisfier
 */

export const expirationSatisfier: Satisfier = {
  condition: 'expiration',
  satisfyPrevious: (prev: Caveat, curr: Caveat) => {
    if (prev.condition !== 'expiration' || curr.condition !== 'expiration')
      return false
    // fails if current expiration is later than previous
    // (i.e. newer caveats should be more restrictive)
    else if (prev.value < curr.value) return false
    else return true
  },
  satisfyFinal: (caveat: Caveat) => {
    if (caveat.condition !== 'expiration') return false
    // if the expiration value is less than current time than satisfier is failed
    if (caveat.value < Date.now()) return false
    return true
  },
}

export const createServicesSatisfier = (targetService: string): Satisfier => {
  // validate targetService
  if (typeof targetService !== 'string') throw new InvalidServicesError()

  return {
    condition: SERVICES_CAVEAT_CONDITION,
    satisfyPrevious: (prev: Caveat, curr: Caveat): boolean => {
      const prevServices = decodeServicesCaveat(prev.value.toString())
      const currentServices = decodeServicesCaveat(curr.value.toString())

      // making typescript happy
      if (!Array.isArray(prevServices) || !Array.isArray(currentServices))
        throw new InvalidServicesError()

      // Construct a set of the services we were previously
      // allowed to access.
      let previouslyAllowed = new Map()
      previouslyAllowed = prevServices.reduce(
        (prev, current) => prev.set(current.name, current.tier),
        previouslyAllowed
      )

      // The caveat should not include any new services that
      // weren't previously allowed.
      for (const service of currentServices) {
        if (!previouslyAllowed.has(service.name)) return false
        // confirm that previous service tier cannot be higher than current
        const prevTier: number = previouslyAllowed.get(service.name)
        if (prevTier > service.tier) return false
      }

      return true
    },

    satisfyFinal: (caveat: Caveat): boolean => {
      const services = decodeServicesCaveat(caveat.value.toString())
      // making typescript happy
      if (!Array.isArray(services)) throw new InvalidServicesError()

      for (const service of services) {
        if (service.name === targetService) return true
      }
      return false
    },
  }
}

export const createCapabilitiesSatisfier = (
  service: string,
  targetCapability: string
): Satisfier => {
  // validate targetService
  if (typeof targetCapability !== 'string') throw new InvalidCapabilitiesError()
  if (typeof service !== 'string') throw new InvalidCapabilitiesError()

  return {
    condition: service + SERVICE_CAPABILITIES_SUFFIX,
    satisfyPrevious: (prev: Caveat, curr: Caveat): boolean => {
      const prevCapabilities = decodeCapabilitiesValue(prev.value.toString())
      const currentCapabilities = decodeCapabilitiesValue(curr.value.toString())

      // making typescript happy
      if (
        !Array.isArray(prevCapabilities) ||
        !Array.isArray(currentCapabilities)
      )
        throw new InvalidServicesError()

      // Construct a set of the service's capabilities we were
      // previously allowed to access.
      let previouslyAllowed = new Set()
      previouslyAllowed = prevCapabilities.reduce(
        (prev, current) => prev.add(current),
        previouslyAllowed
      )

      // The caveat should not include any new service
      // capabilities that weren't previously allowed.
      for (const capability of currentCapabilities) {
        if (!previouslyAllowed.has(capability)) return false
      }

      return true
    },
    satisfyFinal: (caveat: Caveat): boolean => {
      const capabilities = decodeCapabilitiesValue(caveat.value.toString())
      // making typescript happy
      if (!Array.isArray(capabilities)) throw new InvalidServicesError()

      for (const capability of capabilities) {
        if (capability === targetCapability) return true
      }
      return false
    },
  }
}
