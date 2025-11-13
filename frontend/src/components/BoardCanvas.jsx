import React, { useRef, useEffect, useState } from "react";

export default function BoardCanvas({
  path = [],
  dropColumn = 6,
  onLanding,
  mute = false,
  reducedMotion = false
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [layout, setLayout] = useState(null);

  const ROWS = 12;
  const BINS = 13;
  const HEIGHT = 520;
  const BALL_R = 10;
  const PEG_R = 6;

  /** --------------------
   * Compute layout on resize
   * --------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const width = canvas.clientWidth;
      canvas.width = Math.floor(width * window.devicePixelRatio);
      canvas.height = Math.floor(HEIGHT * window.devicePixelRatio);
      canvas.style.height = `${HEIGHT}px`;

      const ctx = canvas.getContext("2d");
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

      // Best board width (responsive)
      const boardWidth = Math.min(width * 0.9, 550);

      const centerX = width / 2;
      const gapX = boardWidth / (ROWS + 1);
      const startY = 60;
      const gapY = (HEIGHT - startY - 120) / ROWS;

      // Build symmetric triangle layout
      const pegPositions = [];

      for (let r = 0; r < ROWS; r++) {
        const cols = r + 1;
        const rowWidth = cols * gapX;

        // Center row horizontally
        const startX = centerX - rowWidth / 2;

        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push({
            x: startX + c * gapX,
            y: startY + r * gapY
          });
        }
        pegPositions.push(row);
      }

      setLayout({ pegPositions, width, boardWidth, gapX });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /** --------------------
   * Simple sound helper
   * --------------------- */
  function playSound(src, volume = 0.1) {
    if (mute) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  /** --------------------
   * Animation + Rendering
   * --------------------- */
  useEffect(() => {
    if (!layout) return;

    const { pegPositions, width, boardWidth, gapX } = layout;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    /** Draw static board (background + pegs + bins) */
    function drawBoard() {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, HEIGHT);

      // Draw pegs
      ctx.fillStyle = "#ffffff";
      pegPositions.forEach(row =>
        row.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
          ctx.fill();
        })
      );

      // Bottom line
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, HEIGHT - 90, width, 2);
    }

    drawBoard();

    if (!path || path.length === 0) return;

    /** Build target coordinates for each step */
    const targets = path.map(step => {
      const peg = pegPositions[step.row][step.pegIndex];
      const offset = gapX * 0.32;

      return {
        x: step.decision === "L" ? peg.x - offset : peg.x + offset,
        y: peg.y + 25
      };
    });

    /** Final bin x-position */
    const totalBins = BINS;
    const binGap = boardWidth / (totalBins - 1);
    const startX = (width - boardWidth) / 2;

    const binIndex = path.filter(s => s.decision === "R").length;
    const finalX = startX + binIndex * binGap;
    const finalY = HEIGHT - 50;

    /** Drop start position */
    const pxStart = startX + dropColumn * binGap;
    let px = pxStart;
    let py = 20;

    let stepIndex = 0;
    let lastTime = 0;
    const speed = reducedMotion ? 0.08 : 0.18;

    /** Draw ball helper */
    function drawBall(x, y) {
      ctx.beginPath();
      ctx.fillStyle = "#ff4d6d";
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    /** Animation loop */
    function animate(ts) {
      if (!lastTime) lastTime = ts;
      const dt = ts - lastTime;
      lastTime = ts;

      drawBoard();

      const target = stepIndex < targets.length ? targets[stepIndex] : { x: finalX, y: finalY };

      px += (target.x - px) * speed * (dt / 16);
      py += (target.y - py) * speed * (dt / 16);

      drawBall(px, py);

      // Arrived at peg?
      if (Math.abs(px - target.x) < 3 && Math.abs(py - target.y) < 3) {
        if (stepIndex < targets.length) playSound("/peg-tick.mp3", 0.1);
        stepIndex++;
      }

      // Landed in bin
      if (stepIndex > targets.length) {
        playSound("/celebrate.mp3", 0.25);
        onLanding && onLanding(binIndex);
        return; // stop animation
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [layout, path, dropColumn, mute, reducedMotion, onLanding]);

  return (
    <div className="board-box card">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: HEIGHT,
          background: "#1e293b",
          borderRadius: "10px",
          display: "block"
        }}
      />
    </div>
  );
}
