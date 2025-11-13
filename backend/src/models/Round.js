const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['CREATED','STARTED','REVEALED'], default: 'CREATED' },
  nonce: { type: String, required: true },
  commitHex: { type: String, required: true },
  serverSeed: { type: String, default: null },
  clientSeed: { type: String, default: '' },
  combinedSeed: { type: String, default: '' },
  pegMapHash: { type: String, default: '' },
  rows: { type: Number, default: 12 },
  dropColumn: { type: Number, default: 6 },
  binIndex: { type: Number, default: null },
  payoutMultiplier: { type: Number, default: 0 },
  betCents: { type: Number, default: 0 },
  pathJson: { type: Object, default: {} },
  revealedAt: { type: Date }
});

module.exports = mongoose.model('Round', RoundSchema);
