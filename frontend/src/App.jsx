import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import GamePage from "./pages/GamePage";
import VerifyPage from "./pages/VerifyPage";

export default function App() {
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">Daphnis Labs — Plinko Lab</div>
        <nav className="navlinks">
          <Link to="/">Game</Link>
          <Link to="/verify">Verifier</Link>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </main>

      <footer className="footer">Provably-fair demo • No real money</footer>
    </div>
  );
}
