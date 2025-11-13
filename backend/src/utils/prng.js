// xorshift32 with big-endian 4 bytes seed
function xorshift32(seed) {
  // store as uint32
  let x = seed >>> 0;
  return function() {
    // xorshift32 steps
    x ^= (x << 13);
    x >>>= 0;
    x ^= (x >>> 17);
    x ^= (x << 5);
    x >>>= 0;
    return x >>> 0;
  }
}

// Return generator that yields float rand() in [0,1)
function prngFromSeedHex(seedHex) {
  // take first 4 bytes (8 hex chars) as big-endian uint32
  const first8 = seedHex.slice(0,8);
  const seed = parseInt(first8, 16) >>> 0; // big-endian parse is natural here
  const xs = xorshift32(seed);
  return {
    // return rand float
    rand: () => {
      const v = xs();
      // divide by 2^32
      return (v >>> 0) / 4294967296;
    },
    raw: xs
  };
}

module.exports = { prngFromSeedHex };
