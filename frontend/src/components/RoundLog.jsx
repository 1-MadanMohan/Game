import React, { useEffect, useState } from "react";
import { getRounds } from "../api";

export default function RoundLog({ onSelect }) {
  const [rounds, setRounds] = useState([]);

  async function fetchRounds() {
    try {
      const res = await getRounds(20);
      setRounds(res.data || []);
    } catch (e) {
      setRounds([]);
    }
  }

  useEffect(() => { fetchRounds(); }, []);

  return (
    <div className="round-log card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h4>Recent Rounds</h4>
        <button onClick={fetchRounds}>Reload</button>
      </div>
      <ul className="round-list">
        {rounds.map(r => (
          <li key={r._id} onClick={() => onSelect && onSelect(r)}>
            <div><strong>{(r._id||'').slice(0,8)}</strong> • bin:{r.binIndex ?? "—"} • drop:{r.dropColumn}</div>
            <div className="muted small">{r.pegMapHash ?? "—"}</div>
          </li>
        ))}
        {rounds.length === 0 && <li className="muted">No rounds yet</li>}
      </ul>
    </div>
  );
}
