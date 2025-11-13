import React, { useState, useEffect } from "react";
import Controls from "../components/Controls";
import RoundLog from "../components/RoundLog";
import BoardCanvas from "../components/BoardCanvas";
import { commitRound, startRound, revealRound, getRound } from "../api";
import { computeRound } from "../utils/engineClientMirror";

export default function GamePage() {
  const [roundId, setRoundId] = useState(null);
  const [commitHex, setCommitHex] = useState("");
  const [nonce, setNonce] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [dropColumn, setDropColumn] = useState(6);
  const [bet, setBet] = useState(100);

  const [startedData, setStartedData] = useState(null);
  const [path, setPath] = useState(null);
  const [mute, setMute] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resultBin, setResultBin] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setDropColumn(d => Math.max(0, d-1));
      if (e.key === "ArrowRight") setDropColumn(d => Math.min(12, d+1));
      if (e.key === " ") { e.preventDefault(); handleStart(); }
      if (e.key.toLowerCase() === "m") setMute(m => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleCommit() {
    const res = await commitRound();
    setRoundId(res.data.roundId);
    setCommitHex(res.data.commitHex);
    setNonce(res.data.nonce);
    setStartedData(null);
    setPath(null);
    setResultBin(null);
  }

  async function handleStart() {
    if (!roundId) return alert("Commit first");
    const res = await startRound(roundId, { clientSeed, betCents: bet, dropColumn });
    setStartedData(res.data);
    // prefer server path, fallback to local computation using combinedSeed
    if (res.data.path) setPath(res.data.path);
    else if (res.data.combinedSeed) {
      const engine = computeRound({ combinedSeedHex: res.data.combinedSeed, dropColumn, rows: 12 });
      setPath(engine.path);
    } else {
      alert("No path returned");
    }
    setResultBin(null);
  }

  async function handleReveal() {
    if (!roundId) return;
    await revealRound(roundId);
    const full = await getRound(roundId);
    alert("ServerSeed revealed. You can verify on /verify");
  }

  function handleSelectRound(r) {
    if (r.pathJson) {
      setPath(r.pathJson);
      setRoundId(r._id);
    } else {
      getRound(r._id).then(res => {
        setPath(res.data.pathJson);
        setRoundId(res.data._id);
      }).catch(() => {});
    }
  }

  return (
    <div className="game-grid">
      <aside className="left-col">
        <Controls
          roundId={roundId}
          commitHex={commitHex}
          nonce={nonce}
          clientSeed={clientSeed}
          setClientSeed={setClientSeed}
          dropColumn={dropColumn}
          setDropColumn={setDropColumn}
          bet={bet}
          setBet={setBet}
          onCommit={handleCommit}
          onStart={handleStart}
          onReveal={handleReveal}
          mute={mute}
          setMute={setMute}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
        />
        <RoundLog onSelect={handleSelectRound} />
      </aside>

      <section className="center-col">
        <div className="board-area">
          <BoardCanvas
            path={path}
            dropColumn={dropColumn}
            onLanding={(bin) => { setResultBin(bin); }}
            mute={mute}
            reducedMotion={reducedMotion}
          />
        </div>

        <div className="info-panel card">
          <div><strong>Round:</strong> {roundId ?? "—"}</div>
          <div><strong>Bin (server):</strong> {startedData?.binIndex ?? (resultBin !== null ? resultBin : "—")}</div>
          <div><strong>PegMapHash:</strong> <code style={{wordBreak:'break-all'}}>{startedData?.pegMapHash ?? "—"}</code></div>
        </div>
      </section>

      <aside className="right-col">
        <div className="card small">
          <h4>Shortcuts</h4>
          <p>Arrow keys: change drop column. Space: Drop. M: Mute.</p>
        </div>
      </aside>
    </div>
  );
}
