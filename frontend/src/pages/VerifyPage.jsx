import React, { useState } from "react";
import { verifyRound } from "../api";
import { computeRound } from "../utils/engineClientMirror";
import BoardCanvas from "../components/BoardCanvas";

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [dropColumn, setDropColumn] = useState(6);
  const [result, setResult] = useState(null);
  const [localPath, setLocalPath] = useState(null);

  async function onVerify(e) {
    e.preventDefault();
    const res = await verifyRound({ serverSeed, clientSeed, nonce, dropColumn });
    setResult(res.data);
    const engine = computeRound({ combinedSeedHex: res.data.combinedSeed, dropColumn: Number(dropColumn), rows: 12 });
    setLocalPath(engine.path);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Verifier</h2>
      <form onSubmit={onVerify} style={{display:'grid', gap:8, maxWidth:640}}>
        <input placeholder="serverSeed" value={serverSeed} onChange={e=>setServerSeed(e.target.value)} />
        <input placeholder="clientSeed" value={clientSeed} onChange={e=>setClientSeed(e.target.value)} />
        <input placeholder="nonce" value={nonce} onChange={e=>setNonce(e.target.value)} />
        <input type="number" min="0" max="12" value={dropColumn} onChange={e=>setDropColumn(e.target.value)} />
        <button>Verify</button>
      </form>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div>commitHex: <code>{result.commitHex}</code></div>
          <div>combinedSeed: <code>{result.combinedSeed}</code></div>
          <div>pegMapHash: <code>{result.pegMapHash}</code></div>
          <div>binIndex: <code>{result.binIndex}</code></div>

          <h4>Replay</h4>
          <BoardCanvas path={localPath} dropColumn={Number(dropColumn)} />
        </div>
      )}
    </div>
  );
}
