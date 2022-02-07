/** 
 * @file Services are a special kind of caveat based off of
 * the official lsat spec by 
 * [Lightning Labs](https://lsat.tech/macaroons#target-services).
 * These have certain expectations around value encoding and also support
 * tiers of capabilities where services have service level capabilities and 
 * capabilities in turn can have constraints.
 * See below for an example from lightning loop.
 * 
 * @example
 *  services = lightning_loop:0
 *  lightning_loop_capabilities = loop_out,loop_in
 *  loop_out_monthly_volume_sats = 200000000
 * 
 */

import bufio from 'bufio'

export class NoServicesError extends Error {
  constructor(...params: string[]) {
    super(...params)
    this.name = 'NoServicesError'
    this.message = 'no services found'
        // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoServicesError)
    }
  }
}

export class InvalidServicesError extends Error {
  constructor(message?:string) {
    super(message)
    this.name = 'InvalidServicesError'
    if (!message)
      this.message = 'service must be of the form "name:tier"'
        // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidServicesError)
    }
  }
}

export interface ServiceClassOptions {
  name: string
  tier: number
}

export class Service extends bufio.Struct {
  name: string
  tier: number

  constructor(options: ServiceClassOptions) {
    super(options)
    this.name = options.name
    this.tier = options.tier
  }
}

/**
 * 
 * @param {string} s - raw services string of format `name:tier,name:tier`
 * @returns array of Service objects or throws an error
 */
export const decodeServicesCaveat = (s:string): Service[] | Error => {
  if (!s.length) throw new NoServicesError()

  const services: Service[] = []
  const rawServices = s.split(',')

  for(const serviceString of rawServices) {
    const [service, tier] = serviceString.split(':')
    // validation
    if (!service || !tier) throw new InvalidServicesError()
    if (isNaN(+tier)) throw new InvalidServicesError('tier must be a number')
    if (!isNaN(+service)) throw new InvalidServicesError('service name must be a string')
    services.push(new Service({name: service, tier: +tier}))
  }

  return services
}

export const encodeServicesCaveatValue = (services: Service[]): string | Error => {
  if (!services.length) throw new NoServicesError()

  let rawServices = ''

  for (let i=0; i < services.length; i++) {
    const service = services[i];
    if (!(service instanceof Service)) throw new InvalidServicesError('not a valid service')
    if (!service.name) throw new InvalidServicesError('service must nave a name') 
    if (service.tier !== 0 && !service.tier) throw new InvalidServicesError('service must have a tier')

    rawServices = rawServices.concat(`${service.name}:${service.tier}`)
    // add a comma at the end if it's not the same
    if (i !== services.length - 1) rawServices = `${rawServices},`
  }
  return rawServices
}


/**
 * services=meme:0
 * meme_capabilities=
 */