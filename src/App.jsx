import { useState, useCallback } from 'react';
import Hero from './components/Hero';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';

export default function App() {
  const [hud, setHud] = useState({ score: 0, coins: 0, time: 0, lives: 3 });

  const handleUpdate = useCallback((data) => {
    setHud((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Hero />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">2D Pixel Platformer</h2>
            <p className="text-neutral-400">Run, jump, and collect coins. Classic Mario-inspired vibes.</p>
          </div>
          <HUD score={hud.score} coins={hud.coins} time={hud.time} lives={hud.lives} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <GameCanvas onUpdate={handleUpdate} />
          </div>
          <div className="lg:col-span-4">
            <Controls />
          </div>
        </div>
      </main>
    </div>
  );
}
