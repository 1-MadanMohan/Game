import { sha256 } from "js-sha256";

// xorshift32 seeded from first 4 bytes (big-endian)
function xorshift32Factory(seed) {
  let x = seed >>> 0;
  return function raw() {
    x ^= (x << 13);
    x >>>= 0;
    x ^= (x >>> 17);
    x ^= (x << 5);
    x >>>= 0;
    return x >>> 0;
  };
}

export function prngFromSeedHex(seedHex) {
  const first8 = (seedHex || "").slice(0, 8).padEnd(8, "0");
  const seed = parseInt(first8, 16) >>> 0;
  const raw = xorshift32Factory(seed);
  return {
    rand: () => (raw() >>> 0) / 4294967296,
    raw
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

export function generatePegMap(rows, rand) {
  const pegMap = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let i = 0; i <= r; i++) {
      const v = 0.5 + (rand() - 0.5) * 0.2;
      row.push({ leftBias: round6(v) });
    }
    pegMap.push(row);
  }
  return pegMap;
}

export function computeRound({ combinedSeedHex, dropColumn = 6, rows = 12 }) {
  const { rand } = prngFromSeedHex(combinedSeedHex);
  const pegMap = generatePegMap(rows, rand);
  const pegMapHash = sha256(JSON.stringify(pegMap));

  const adj = (dropColumn - Math.floor(rows / 2)) * 0.01;
  let pos = 0;
  const path = [];

  for (let r = 0; r < rows; r++) {
    const pegIndex = Math.min(pos, r);
    const peg = pegMap[r][pegIndex];
    let bias = peg.leftBias + adj;
    if (bias < 0) bias = 0;
    if (bias > 1) bias = 1;
    const rnd = rand();
    const decision = rnd < bias ? "L" : "R";
    if (decision === "R") pos += 1;
    path.push({
      row: r,
      pegIndex,
      leftBias: peg.leftBias,
      adj: Math.round(adj * 1e6) / 1e6,
      bias: round6(bias),
      rnd: Number(rnd.toFixed(10)),
      decision
    });
  }

  return { pegMap, pegMapHash, path, binIndex: pos };
}
