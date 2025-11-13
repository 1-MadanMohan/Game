const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const { sha256Hex } = require('../utils/cryptoUtils');
const { computeRound } = require('../utils/engine');
const crypto = require('crypto');

// helper to gen random hex
function randomHex(bytes=32){
  return crypto.randomBytes(bytes).toString('hex');
}

/** POST /api/rounds/commit */
router.post('/commit', async (req, res) => {
  // create serverSeed + nonce + commit
  const serverSeed = randomHex(32);
  const nonce = (Math.floor(Math.random()*1e9)).toString();
  const commitHex = sha256Hex(`${serverSeed}:${nonce}`);
  const round = await Round.create({ nonce, commitHex });
  // store serverSeed in DB but keep it null to client? (we must not reveal)
  // To keep secret, we do NOT store serverSeed plaintext in returned object; but store in DB serverSeed field encrypted OR store plain serverSeed server-side (here store but not return)
  round.serverSeed = serverSeed; // server-side stored
  await round.save();
  res.json({ roundId: round._id, commitHex, nonce });
});

/** POST /api/rounds/:id/start */
router.post('/:id/start', async (req, res) => {
  const { clientSeed = '', betCents = 0, dropColumn = 6 } = req.body;
  const round = await Round.findById(req.params.id);
  if (!round) return res.status(404).json({ error: 'not found' });
  if (round.status !== 'CREATED') return res.status(400).json({ error: 'invalid status' });

  // combinedSeed = SHA256(serverSeed:clientSeed:nonce)
  const combinedSeed = sha256Hex(`${round.serverSeed}:${clientSeed}:${round.nonce}`);
  // compute deterministic round
  const { pegMap, pegMapHash, path, binIndex } = computeRound({ combinedSeedHex: combinedSeed, dropColumn, rows: round.rows || 12 });

  // simple symmetric paytable example
  const edge = Math.abs(binIndex - Math.floor((round.rows||12)/2));
  const payoutMultiplier = 1 + (Math.floor(((round.rows||12)/2) - edge) * 0.1); // example

  round.clientSeed = clientSeed;
  round.combinedSeed = combinedSeed;
  round.pegMapHash = pegMapHash;
  round.pathJson = path;
  round.binIndex = binIndex;
  round.dropColumn = dropColumn;
  round.betCents = betCents;
  round.payoutMultiplier = payoutMultiplier;
  round.status = 'STARTED';
  await round.save();

  res.json({ roundId: round._id, pegMapHash, rows: round.rows || 12, binIndex, path }); // note: binIndex returned so we can animate; serverSeed not revealed
});

/** POST /api/rounds/:id/reveal */
router.post('/:id/reveal', async (req, res) => {
  const round = await Round.findById(req.params.id);
  if (!round) return res.status(404).json({ error: 'not found' });
  if (round.status === 'REVEALED') return res.status(400).json({ error: 'already revealed' });
  // reveal serverSeed
  round.status = 'REVEALED';
  round.revealedAt = new Date();
  await round.save();
  // return serverSeed
  res.json({ serverSeed: round.serverSeed });
});

/** GET /api/rounds/:id */
router.get('/:id', async (req, res) => {
  const round = await Round.findById(req.params.id);
  if (!round) return res.status(404).json({ error: 'not found' });
  res.json(round);
});

/** GET /api/verify?serverSeed&clientSeed&nonce&dropColumn */
router.get('/verify', async (req, res) => {
  const { serverSeed, clientSeed = '', nonce, dropColumn = 6 } = req.query;
  if (!serverSeed || !nonce) return res.status(400).json({ error: 'missing' });
  const commitHex = sha256Hex(`${serverSeed}:${nonce}`);
  const combinedSeed = sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
  const { pegMapHash, binIndex } = (function() {
    const { pegMapHash, binIndex } = computeRound({ combinedSeedHex: combinedSeed, dropColumn: Number(dropColumn), rows: 12 });
    return { pegMapHash, binIndex };
  })();
  res.json({ commitHex, combinedSeed, pegMapHash, binIndex });
});

module.exports = router;
