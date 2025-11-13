```markdown
# 🎰 Plinko Lab — Provably-Fair Plinko (MERN)

**Repository:** plinko/  
A complete take-home implementation of the Daphnis Labs Plinko Lab (provably-fair).  
Stack: **MongoDB / Express / Node.js (backend)** + **React + Vite (frontend)**.

---

## Project summary

- **Provably-fair commit→reveal** RNG (server seed, nonce → commitHex).  
- **Deterministic engine** seeded from `combinedSeed = SHA256(serverSeed:clientSeed:nonce)`.  
- PRNG: **xorshift32** seeded from first 4 bytes (big-endian) of combinedSeed.  
- Peg map: leftBias ∈ [0.4,0.6], rounded to 6 decimals. Peg map hashed with SHA-256 (`pegMapHash`).  
- UI: symmetric Plinko board (12 rows, 13 bins), smooth canvas animation, New Round / Drop / Reveal flow.  
- Verifier page: recompute commitHex, combinedSeed, pegMapHash, binIndex and replay path.  
- DB: MongoDB rounds log for auditing and replay.

---

## File structure (top level)

```

plinko/
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  └─ src/
│     ├─ server.js
│     ├─ app.js
│     ├─ config/db.js
│     ├─ models/Round.js
│     ├─ routes/rounds.js
│     └─ utils/
│        ├─ cryptoUtils.js
│        ├─ prng.js
│        └─ engine.js
└─ frontend/
├─ package.json
├─ vite.config.js
├─ .env
├─ public/ (optional audio)
└─ src/
├─ index.jsx
├─ App.jsx
├─ api.js
├─ utils/engineClientMirror.js
├─ components/BoardCanvas.jsx
├─ components/Controls.jsx
├─ components/RoundLog.jsx
├─ pages/GamePage.jsx
└─ pages/VerifyPage.jsx

```

---

## Quickstart — local (dev)

### Backend
1. `cd plinko/backend`  
2. Copy `.env.example` → `.env` and set:
```

MONGO_URI=mongodb+srv://<user>:<pass>@.../plinko?retryWrites=true&w=majority
PORT=5000

````
3. Install & run:
```bash
npm install
npm run dev
````

4. Backend REST API available at `http://localhost:5000`.

### Frontend

1. `cd plinko/frontend`
2. Ensure `.env` has:

   ```
   VITE_API_URL=http://localhost:5000
   ```
3. Install & run:

   ```bash
   npm install
   npm run dev
   ```
4. Frontend served by Vite (default `http://localhost:5173`).

---

## API (summary)

* `POST /api/rounds/commit` → `{ roundId, commitHex, nonce }`
  Server generates `serverSeed` (kept secret), `nonce`, stores `commitHex = SHA256(serverSeed:nonce)`.

* `POST /api/rounds/:id/start` body: `{ clientSeed, betCents, dropColumn }` → `{ roundId, pegMapHash, path, binIndex, combinedSeed? }`
  Server computes `combinedSeed = SHA256(serverSeed:clientSeed:nonce)`, generates pegMap & path deterministically, stores results (serverSeed still hidden).

* `POST /api/rounds/:id/reveal` → `{ serverSeed }`
  Server marks round REVEALED and returns `serverSeed`.

* `GET /api/rounds/:id` → full round doc (for UI & verifier).

* `GET /api/rounds?limit=20` → recent rounds.

* `GET /api/rounds/verify?serverSeed&clientSeed&nonce&dropColumn` → recompute `{ commitHex, combinedSeed, pegMapHash, binIndex, path }`.

---

## Deterministic engine (spec)

* Rows `R = 12`. Bins `0..12`.
* `combinedSeed = SHA256(serverSeed:clientSeed:nonce)` (hex).
* PRNG: `xorshift32` seeded from **first 4 bytes** of `combinedSeed` (big-endian). `rand()` → float in [0,1).
* Peg map generation:

  * For each row `r` (0..R-1), create `r+1` pegs.
  * Each peg `leftBias = 0.5 + (rand() - 0.5) * 0.2`.
  * Round `leftBias` to **6 decimals**.
* `pegMapHash = SHA256(JSON.stringify(pegMap))`.
* Drop column adjustment:

  * `adj = (dropColumn - floor(R/2)) * 0.01`.
  * `bias' = clamp(leftBias + adj, 0, 1)`.
* Decision per row:

  * Use peg at index `min(pos, r)` where `pos` = number of Right moves so far.
  * Get `rnd = rand()`. If `rnd < bias'` → Left, else Right (if Right, `pos += 1`).
* Final `binIndex = pos`.

> The server follows the same stream order: first generate pegMap (consuming PRNG), then make row decisions — ensuring exact replay.

---

## Test vectors (included / used in unit tests)

**Inputs**

```
rows = 12
serverSeed = "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc"
nonce = "42"
clientSeed = "candidate-hello"
```

**Derived**

```
commitHex = bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34
combinedSeed = e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0
PRNG = xorshift32 seeded from first 4 bytes of combinedSeed (big-endian)
First 5 rand() in [0,1): 0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297
Peg map first rows (leftBias rounded to 6dp):
Row 0: [0.422123]
Row 1: [0.552503, 0.408786]
Row 2: [0.491574, 0.468780, 0.436540]
dropColumn = 6 (center), adj = 0 → binIndex = 6
```

These are asserted in `backend/src/tests/engine.test.js`.

---

## UI / UX

* **Game page**: New Round → enter clientSeed (optional) → set drop column → Drop → Board animates ball along deterministic path → shows landed bin / payout multiplier. Reveal reveals serverSeed for verification.
* **Verifier page**: paste `serverSeed`, `clientSeed`, `nonce`, `dropColumn` → recompute commitHex, combinedSeed, pegMapHash, binIndex → replay path locally.
* Accessibility: keyboard arrows adjust drop column, space to drop, mute toggle available.
* Responsive canvas: centered symmetric triangular peg layout.

---

## Security & notes

* **ServerSeed is stored server-side** and only returned by `/reveal`. Do **not** expose serverSeed to clients before reveal.
* Validate all inputs server-side (the server checks round state).
* No real money — `betCents` is just a number. Do not integrate payment providers.

---

## Where & how AI was used

* Generated initial frontend layout and Canvas animation scaffolding 
* Used AI to refactor animation loop and PRNG mirroring code for correctness and readability.


---

## Time log & next steps (rough)

* Implementation & testing: ~8–12 hours (backend + deterministic engine + frontend animation + verifier).
* Next improvements if more time:

  * Add fixed-timestep physics (Matter.js) and keep deterministic path authoritative.
  * Realtime session log (WebSockets) and CSV export.
  * More unit/integration tests for endpoints and full verifier flow.
  * Theming, accessibility audit, and production build/deploy scripts.

---

## Scripts

### Backend

```bash
# in backend/
npm install
npm run dev   # nodemon
npm test      # run unit tests
```

### Frontend

```bash
# in frontend/
npm install
npm run dev
npm run build
```

```

