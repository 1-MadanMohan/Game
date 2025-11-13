const { prngFromSeedHex } = require('./prng');
const { sha256Hex } = require('./cryptoUtils');

function roundTo6(n) {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * generatePegMap(rows, prng.rand)
 * pegMap: array of rows; row r has r+1 pegs, each { leftBias }
 */
function generatePegMap(rows, rand) {
  const pegMap = [];
  for (let r=0;r<rows;r++){
    const row = [];
    for (let i=0;i<=r;i++){
      // leftBias = 0.5 + (rand() - 0.5) * 0.2
      const v = 0.5 + (rand() - 0.5) * 0.2;
      row.push({ leftBias: roundTo6(v) });
    }
    pegMap.push(row);
  }
  return pegMap;
}

/**
 * compute path and bin given combinedSeed, dropColumn, rows
 */
function computeRound({ combinedSeedHex, dropColumn=6, rows=12 }) {
  const prng = prngFromSeedHex(combinedSeedHex);
  const rand = prng.rand;

  const pegMap = generatePegMap(rows, rand);
  const pegMapHash = sha256Hex(JSON.stringify(pegMap));

  // drop influence
  const adj = (dropColumn - Math.floor(rows/2)) * 0.01;

  let pos = 0;
  const path = []; // per row decision: 'L'|'R', bias used, rnd value
  for (let r=0; r<rows; r++) {
    const pegIndex = Math.min(pos, r);
    const peg = pegMap[r][pegIndex];
    let bias = peg.leftBias + adj;
    if (bias < 0) bias = 0;
    if (bias > 1) bias = 1;
    // draw rnd
    const rnd = rand();
    const decision = (rnd < bias) ? 'L' : 'R';
    if (decision === 'R') pos += 1;
    path.push({ row: r, pegIndex, leftBias: peg.leftBias, adj: roundTo6(adj), bias: roundTo6(bias), rnd: Number(rnd.toFixed(10)), decision });
  }
  const binIndex = pos;
  return { pegMap, pegMapHash, path, binIndex };
}

module.exports = { computeRound, generatePegMap };
