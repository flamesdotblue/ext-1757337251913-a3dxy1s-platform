import { useState, useRef } from 'react';
import Hero from './components/Hero';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';

export default function App() {
  const [hud, setHud] = useState({ score: 0, coins: 0, lives: 3, level: 1 });
  const gameRef = useRef(null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <Hero />

      <section id="game" className="relative max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pixel Mario</h2>
            <p className="text-slate-300">Run, jump, and collect coins. Reach the flag!</p>
          </div>
          <Controls />
        </div>

        <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-slate-900">
          <HUD score={hud.score} coins={hud.coins} lives={hud.lives} level={hud.level} />
          <GameCanvas ref={gameRef} onGameUpdate={setHud} />
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 py-12 text-sm text-slate-400">
        Built with React, Canvas, and a Mario-themed cover.
      </footer>
    </div>
  );
}
