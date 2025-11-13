const { sha256Hex } = require('../utils/cryptoUtils');
const { computeRound } = require('../utils/engine');

test('test vector combiners', () => {
  const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
  const nonce = '42';
  const clientSeed = 'candidate-hello';

  const commitHex = sha256Hex(`${serverSeed}:${nonce}`);
  expect(commitHex).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');

  const combinedSeed = sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
  // assert combinedSeed equals the reference
  expect(combinedSeed).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');

  // compute first few rand() optionally by mocking prngFromSeedHex to match exact outputs
  // computeRound and pegMapHash and binIndex
  const result = computeRound({ combinedSeedHex: combinedSeed, dropColumn: 6, rows: 12 });
  expect(result.binIndex).toBe(6);
  // Optionally assert pegMap first values, rounding to 6dp
  expect(result.pegMap[0][0].leftBias).toBeCloseTo(0.422123, 6);
});
