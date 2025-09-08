export default function HUD({ score = 0, coins = 0, lives = 3, level = 1 }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-xs sm:text-sm font-mono text-white/95">
        <div className="flex items-center gap-4">
          <span className="bg-black/40 rounded px-2 py-1 ring-1 ring-white/10">Score: {score}</span>
          <span className="bg-black/40 rounded px-2 py-1 ring-1 ring-white/10">Coins: {coins}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-black/40 rounded px-2 py-1 ring-1 ring-white/10">Lives: {lives}</span>
          <span className="bg-black/40 rounded px-2 py-1 ring-1 ring-white/10">World 1-{level}</span>
        </div>
      </div>
    </div>
  );
}
