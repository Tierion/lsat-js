export const invoice = {
  payreq:
    'lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnf' +
    'fpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8p' +
    'dfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnj' +
    'lhs6w75390wy7ukj6cpfmygah',
  secret: '2ca931a1c36b48f54948b898a271a53ed91ff7d0081939a5fa511249e81cba5c',
  paymentHash:
    '7cef93f2c51aa65208bec1447fc38fc58d9bce1375a532edb0dcd290a2c330ae',
}

export const testChallengeParts = [
  {
    testName: 'macaroon with padding',
    challenge: `macaroon="AgESMy4xMzYuMTc4LjE1OjM0MjM4AkIAAD2b0rX78LATiVo8bKgHuurefeF5OeX2H5ZuacBIK3+RAR1PKU1oZpfCZFib4zdDoj0pOpgPmhtuzNllU+y//D0AAAYgcWFs9FIteCzpCcEPSwmXKBpcx97hyL5Yt99cbLjRHzU="`,
    expectedValue:
      'AgESMy4xMzYuMTc4LjE1OjM0MjM4AkIAAD2b0rX78LATiVo8bKgHuurefeF5OeX2H5ZuacBIK3+RAR1PKU1oZpfCZFib4zdDoj0pOpgPmhtuzNllU+y//D0AAAYgcWFs9FIteCzpCcEPSwmXKBpcx97hyL5Yt99cbLjRHzU=',
  },
  {
    testName: 'invoice challenge',
    challenge: `invoice="lntb20n1psza5dwpp58kda9d0m7zcp8z2683k2spa6at08mcte88jlv8ukde5uqjpt07gsdzjfp85gnpqd9h8vmmfvdjjqurp09kk2mn5ypn8ymmdyppksctfdecx76twwssyxmmjv5sxcmny8gcnqvps8ycqzpgsp5m7xru8dlhrhmwjp8gynsj2l9mwan2jk52ah5xucrn9kc3p0pj5ns9qy9qsq7jjxypyyc7hvvs8srh6c3lvcp5l5wka94htnfxak99hd5qrx69sya9sj4zm3w5lncw0tksf944q73tduhlhs5apd63m9dte9dhva5dgqaceunx"`,
    expectedValue: `lntb20n1psza5dwpp58kda9d0m7zcp8z2683k2spa6at08mcte88jlv8ukde5uqjpt07gsdzjfp85gnpqd9h8vmmfvdjjqurp09kk2mn5ypn8ymmdyppksctfdecx76twwssyxmmjv5sxcmny8gcnqvps8ycqzpgsp5m7xru8dlhrhmwjp8gynsj2l9mwan2jk52ah5xucrn9kc3p0pj5ns9qy9qsq7jjxypyyc7hvvs8srh6c3lvcp5l5wka94htnfxak99hd5qrx69sya9sj4zm3w5lncw0tksf944q73tduhlhs5apd63m9dte9dhva5dgqaceunx`,
  },
]

export const aperture = {
  challenge:
    'LSAT macaroon="AgEEbHNhdAJCAAAwpHpumws6ufQoDwiTLNcge0QPUIWA0+tVY+tKPYAJ/zSfmEGlIpNm3VzxuzCqLhEp5KGiyPLUM9L+kcB7uzS+AAIPc2VydmljZXM9bWVtZTowAAISbWVtZV9jYXBhYmlsaXRpZXM9AAAGILA1VCEIExukt4nG+XR9tX8WJ2BVMiHG3UNt1uYJ+NRD", invoice="lnbcrt100n1p3qqkygpp5xzj85m5mpvatnapgpuyfxtxhypa5gr6sskqd8664v04550vqp8lsdq8f3f5z4qcqzpgsp5tpzvsq5pckqgln3ltpy3e9cf6tf2aj82ffa2tted77ltweuaweks9qyyssq0w5da3k40wtdukac7hp5s58hsxf8k8f52c5qneezu4xg3xh87xrnkl5jwtw098d2gjywx20nmkxl2y4vq9fr89kg5kzcwupv9xpdaggp4fc4ms"',
  macaroon:
    'AgEEbHNhdAJCAAAwpHpumws6ufQoDwiTLNcge0QPUIWA0+tVY+tKPYAJ/zSfmEGlIpNm3VzxuzCqLhEp5KGiyPLUM9L+kcB7uzS+AAIPc2VydmljZXM9bWVtZTowAAISbWVtZV9jYXBhYmlsaXRpZXM9AAAGILA1VCEIExukt4nG+XR9tX8WJ2BVMiHG3UNt1uYJ+NRD',
}

export const testChallenges = [
  {
    name: 'aperture originated challenge',
    challenge:
      'macaroon="AgEEbHNhdAJCAAAwpHpumws6ufQoDwiTLNcge0QPUIWA0+tVY+tKPYAJ/zSfmEGlIpNm3VzxuzCqLhEp5KGiyPLUM9L+kcB7uzS+AAIPc2VydmljZXM9bWVtZTowAAISbWVtZV9jYXBhYmlsaXRpZXM9AAAGILA1VCEIExukt4nG+XR9tX8WJ2BVMiHG3UNt1uYJ+NRD", invoice="lnbcrt100n1p3qqkygpp5xzj85m5mpvatnapgpuyfxtxhypa5gr6sskqd8664v04550vqp8lsdq8f3f5z4qcqzpgsp5tpzvsq5pckqgln3ltpy3e9cf6tf2aj82ffa2tted77ltweuaweks9qyyssq0w5da3k40wtdukac7hp5s58hsxf8k8f52c5qneezu4xg3xh87xrnkl5jwtw098d2gjywx20nmkxl2y4vq9fr89kg5kzcwupv9xpdaggp4fc4ms"',
    paymentHash:
      '30a47a6e9b0b3ab9f4280f08932cd7207b440f508580d3eb5563eb4a3d8009ff',
    macaroon:
      'AgEEbHNhdAJCAAAwpHpumws6ufQoDwiTLNcge0QPUIWA0+tVY+tKPYAJ/zSfmEGlIpNm3VzxuzCqLhEp5KGiyPLUM9L+kcB7uzS+AAIPc2VydmljZXM9bWVtZTowAAISbWVtZV9jYXBhYmlsaXRpZXM9AAAGILA1VCEIExukt4nG+XR9tX8WJ2BVMiHG3UNt1uYJ+NRD',
  },
  {
    name: 'challenge with space',
    expiration: 1644194263693,
    paymentHash:
      '7cef93f2c51aa65208bec1447fc38fc58d9bce1375a532edb0dcd290a2c330ae',
    macaroon:
      'AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZTljNTMyNjZiMWJlMzE1MGI2NjZiM2Y2ZWM3MGYyOGJkNDNhOWQ0ZmQxOTQ2MWE2MjBmYmFjYzMzNzY4YTk5OTQAAhhleHBpcmF0aW9uPTE2NDQxOTQyNjM2OTMAAAYg_1CMq8TuMXv-ERHDWQCtlIhsQwwKiUDmnnh1maDFpkQ',
    challenge:
      'macaroon="AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZTljNTMyNjZiMWJlMzE1MGI2NjZiM2Y2ZWM3MGYyOGJkNDNhOWQ0ZmQxOTQ2MWE2MjBmYmFjYzMzNzY4YTk5OTQAAhhleHBpcmF0aW9uPTE2NDQxOTQyNjM2OTMAAAYg_1CMq8TuMXv-ERHDWQCtlIhsQwwKiUDmnnh1maDFpkQ" invoice="lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah"',
  },
  {
    name: 'challenge without space',
    expiration: 1644194263693,
    paymentHash:
      '7cef93f2c51aa65208bec1447fc38fc58d9bce1375a532edb0dcd290a2c330ae',
    macaroon:
      'AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZTljNTMyNjZiMWJlMzE1MGI2NjZiM2Y2ZWM3MGYyOGJkNDNhOWQ0ZmQxOTQ2MWE2MjBmYmFjYzMzNzY4YTk5OTQAAhhleHBpcmF0aW9uPTE2NDQxOTQyNjM2OTMAAAYg_1CMq8TuMXv-ERHDWQCtlIhsQwwKiUDmnnh1maDFpkQ',
    challenge:
      'macaroon="AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZTljNTMyNjZiMWJlMzE1MGI2NjZiM2Y2ZWM3MGYyOGJkNDNhOWQ0ZmQxOTQ2MWE2MjBmYmFjYzMzNzY4YTk5OTQAAhhleHBpcmF0aW9uPTE2NDQxOTQyNjM2OTMAAAYg_1CMq8TuMXv-ERHDWQCtlIhsQwwKiUDmnnh1maDFpkQ",invoice="lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah"',
  },
  {
    name: 'challenge with golang generated macaroon',
    paymentHash:
      '3d9bd2b5fbf0b013895a3c6ca807baeade7de17939e5f61f966e69c0482b7f91',
    macaroon:
      'AgESMy4xMzYuMTc4LjE1OjM0MjM4AkIAAD2b0rX78LATiVo8bKgHuurefeF5OeX2H5ZuacBIK3+RAR1PKU1oZpfCZFib4zdDoj0pOpgPmhtuzNllU+y//D0AAAYgcWFs9FIteCzpCcEPSwmXKBpcx97hyL5Yt99cbLjRHzU=',
    challenge:
      'macaroon="AgESMy4xMzYuMTc4LjE1OjM0MjM4AkIAAD2b0rX78LATiVo8bKgHuurefeF5OeX2H5ZuacBIK3+RAR1PKU1oZpfCZFib4zdDoj0pOpgPmhtuzNllU+y//D0AAAYgcWFs9FIteCzpCcEPSwmXKBpcx97hyL5Yt99cbLjRHzU=", invoice="lntb20n1psza5dwpp58kda9d0m7zcp8z2683k2spa6at08mcte88jlv8ukde5uqjpt07gsdzjfp85gnpqd9h8vmmfvdjjqurp09kk2mn5ypn8ymmdyppksctfdecx76twwssyxmmjv5sxcmny8gcnqvps8ycqzpgsp5m7xru8dlhrhmwjp8gynsj2l9mwan2jk52ah5xucrn9kc3p0pj5ns9qy9qsq7jjxypyyc7hvvs8srh6c3lvcp5l5wka94htnfxak99hd5qrx69sya9sj4zm3w5lncw0tksf944q73tduhlhs5apd63m9dte9dhva5dgqaceunx"',
  },
]

export const testChallengeErrors = [
  {
    name: 'missing invoice',
    challenge:
      'macaroon=AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZTljNTMyNjZiMWJlMzE1MGI2NjZiM2Y2ZWM3MGYyOGJkNDNhOWQ0ZmQxOTQ2MWE2MjBmYmFjYzMzNzY4YTk5OTQAAhhleHBpcmF0aW9uPTE2NDQxOTQyNjM2OTMAAAYg_1CMq8TuMXv-ERHDWQCtlIhsQwwKiUDmnnh1maDFpkQ',
    error: 'Expected at least two challenges in the LSAT: invoice and macaroon',
  },
  {
    name: 'missing macaroon',
    challenge:
      'invoice="lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah"',
    error: 'Expected at least two challenges in the LSAT: invoice and macaroon',
  },
  {
    name: 'macaroon not in double quotes',
    challenge:
      'macaroon=AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZWFkMDE0MmNlMjcxYjY5OTkzNDY5NDZlYzBlYTg1NmEwZTg4Zjc1YTE5YTZkMGMwNWVhMzZhNTVjY2E1MjYwYzAAAhhleHBpcmF0aW9uPTE2NDQxOTYyMDkwMzkAAAYgC0wqY_xSoouOLRuYipfQAu_HeSSVUDfgkro9Mg6AnHc, invoice="lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah"',
    error:
      'Incorectly encoded challenge, challenges must be enclosed in double quotes',
  },
  {
    name: 'invoice not in double quotes',
    challenge:
      'macaroon="AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZWFkMDE0MmNlMjcxYjY5OTkzNDY5NDZlYzBlYTg1NmEwZTg4Zjc1YTE5YTZkMGMwNWVhMzZhNTVjY2E1MjYwYzAAAhhleHBpcmF0aW9uPTE2NDQxOTYyMDkwMzkAAAYgC0wqY_xSoouOLRuYipfQAu_HeSSVUDfgkro9Mg6AnHc" invoice=lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah',
    error:
      'Incorectly encoded challenge, challenges must be enclosed in double quotes',
  },
  {
    name: 'neither part in double quotes',
    challenge:
      'macaroon=AgEIbG9jYXRpb24ChAEwMDAwN2NlZjkzZjJjNTFhYTY1MjA4YmVjMTQ0N2ZjMzhmYzU4ZDliY2UxMzc1YTUzMmVkYjBkY2QyOTBhMmMzMzBhZWFkMDE0MmNlMjcxYjY5OTkzNDY5NDZlYzBlYTg1NmEwZTg4Zjc1YTE5YTZkMGMwNWVhMzZhNTVjY2E1MjYwYzAAAhhleHBpcmF0aW9uPTE2NDQxOTYyMDkwMzkAAAYgC0wqY_xSoouOLRuYipfQAu_HeSSVUDfgkro9Mg6AnHc invoice=lntb10u1pw7kfm8pp50nhe8uk9r2n9yz97c9z8lsu0ckxehnsnwkjn9mdsmnffpgkrxzhqdq5w3jhxapqd9h8vmmfvdjscqzpgllq2qvdlgkllc27kpd87lz8pdfsfmtteyc3kwq734jpwnvqt96e4nuy0yauzdrtkumxsvawgda8dlljxu3nnjlhs6w75390wy7ukj6cpfmygah',
    error:
      'Incorectly encoded challenge, challenges must be enclosed in double quotes',
  },
]
