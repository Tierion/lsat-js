# LSAT-JS

`lsat-js` is a suite of tools for working with LSATs in Nodejs and Typescript.

An LSAT, or Lightning Service Authentication Token, is a "Lightning native macaroon based bearer
API credential" [1](https://docs.google.com/presentation/d/1QSm8tQs35-ZGf7a7a2pvFlSduH3mzvMgQaf-06Jjaow/edit#slide=id.g623e4b6d0b_0_32).
In other words, a new authentication specification that supports account-less authentication
using lightning invoices and payments.

## Installation

First install as a module using npm or yarn into your package:

```bash
$> npm --save install lsat-js
# or
$> yarn add lsat-js
```

## Usage

`lsat-js` is not a stand-alone server or client and so it can't issue or generate Lsats on its own. It simply
offers utlities for working with Lsats including:

- Serialization and deserialization
- Validation
- Working with caveats (restrictions placed on the LSAT's macaroon)

To test with an actual server that issues LSATs, check out [boltwall](https://github.com/Tierion/boltwall).
The below example assumes a running boltwall (or compatible) server on your local machine.
The same utilities can be used against raw LSATs as well.

```js
import { Lsat } from 'lsat-js'
import fetch from 'node-fetch'

// fetching a protected route which will return a 402 response and LSAT challenge
fetch('http://localhost:5000/protected')
  .then(resp => {
    const header = resp.headers.get('www-authentciate')
    const lsat = Lsat.fromHeader(header)

    // show some information about the lsat
    console.log(lsat.invoice)
    console.log(lsat.baseMacaroon)
    console.log(paymentHash)

    // after the invocie is paid, you can add the preimage
    // this is just a stub for getting the preimage string
    const preimage = getPreimage()

    // this will validate that the preiamge is valid and throw if not
    last.setPreimage(preimage)

    return fetch('http://localhost:5000/protected', {
      headers: {
        'Authorization', lsat.toToken()
      }
    })
  })
  .then(resp => resp.json())
  .then(json => {
    console.log('With valid LSAT, we should get a response:', json)
  })
  .catch(e => console.error(e))
```

## API

To view detailed API docs and type information, please see our full
[API documentation](https://tierion.github.io/lsat-js/).

`lsat-js` provides the following utilities for working with LSATs:

#### Lsat

A class for serializing and deserializing an LSAT. It supports:

- Getting an LSAT from a response header
- Getting an LSAT the raw challenge (header without the `LSAT` type prefix)
- Serializing and Deserializing from a "token" (i.e. what the client sends in the `Authorization` header)
- Adding and verifying the preimage (it will throw if the preimage is not properly formatted
  or if it not does not match the invoice's payment hash)
- Checking if the macaroon is expired
- Versioning through the Identifier class (also exposed via `lsat-js`) to support future updates
  to LSAT serialization

#### Caveat

A caveat is a "condition" that is placed on a macaroon that restricts its use. Using these,
an LSAT can contain additional authorization restrictions besides just payment, e.g. time based or user
based restrictions or authorization levels. This also allows for "attenuation", i.e. the holder of the
LSAT can lend out the authorization with additional caveats restricting its use.

Creating a caveat is as simple as:

```js
import { Caveat } from 'lsat-js'

const caveat = new Caveat({
  condition: 'expiration',
  value: Date.now() + 10000, // expires in 10 seconds
  comp: '=', // this is the default value, also supports "<" and ">"
})
console.log(caveat.encode()) // > expiration=1577228778197
console.log(Caveat.decode(caveat.encode())) // creates new caveat w/ same properties
```

To add the caveat to a macaroon you'll need to use a compatible macaroon library
such as [macaroon.js](https://github.com/nitram509/macaroons.js)

#### `hasCaveat`

A function that takes a raw macaroon and a caveat and returns true or false depending on if
the macaroon contains that caveat.

#### `verifyCaveats`

Verifies caveats given one or a set of caveats and corresponding "satisfiers" to test the caveats against.
A satisfier is an object with a condition, a `satisfyFinal` function, and an optional `satisfyPrevious`
function. `satisfyFinal` will test only the last caveat on a macaroon of the matching condition
and `satisfyPrevious` compares each caveat of the same condition against each other. This allows
more flexible attenuation where you can ensure, for example, that every "new" caveat is not less
restrictive than a previously added one. In the case of an expiration, you probably want to have a satisfier
that tests that a newer `expiration` is sooner than the first `expiration` added, otherwise, a client
could add their own expiration further into the future.

The exported `Satisfier` interface described in the docs provides more details on creating
your own satisfiers

#### `verifyFirstPartyMacaroon`

This can only be run by the creator of the macaroon since the signing secret is required to
verify the macaroon. This will run all necessary checks (requires satisfiers to be passed
as arguments if there are caveats on the macaroon) and return true if the macaroon is valid
or false otherwise.
