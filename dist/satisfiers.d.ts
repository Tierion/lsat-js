/**
 * @file Useful satisfiers that are independent of environment, for example,
 * ones that don't require the request object in a server as these can be used anywhere.
 */
import { Satisfier } from '.';
/**
 * @description A satisfier for validating expiration caveats on macaroon. Used in the exported
 * boltwallConfig TIME_CAVEAT_CONFIGS
 * @type Satisfier
 */
export declare const expirationSatisfier: Satisfier;
