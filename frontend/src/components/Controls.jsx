import React from "react";

export default function Controls({
  roundId,
  onCommit,
  onStart,
  onReveal,
  clientSeed,
  setClientSeed,
  dropColumn,
  setDropColumn,
  bet,
  setBet
}) {
  return (
    <div className="controls card">

      <button onClick={onCommit}>New Round</button>
      <button onClick={onStart}>Drop</button>
      <button onClick={onReveal}>Reveal</button>

      <label>Client Seed</label>
      <input
        value={clientSeed}
        onChange={(e) => setClientSeed(e.target.value)}
        placeholder="Optional"
      />

      <label>Drop Column: {dropColumn}</label>
      <input
        type="range"
        min="0"
        max="12"
        value={dropColumn}
        onChange={(e) => setDropColumn(+e.target.value)}
      />

      <label>Bet (cents)</label>
      <input
        type="number"
        value={bet}
        onChange={(e) => setBet(+e.target.value)}
      />

    </div>
  );
}
