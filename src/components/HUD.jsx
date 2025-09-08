export default function HUD({ score = 0, coins = 0, time = 0, lives = 3 }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2"><span className="font-semibold">Score</span><span className="text-yellow-300">{score}</span></div>
        <div className="flex items-center gap-2"><span className="font-semibold">Coins</span><span className="text-yellow-400">{coins}</span></div>
        <div className="flex items-center gap-2"><span className="font-semibold">Lives</span><span className="text-red-400">{lives}</span></div>
        <div className="ml-auto flex items-center gap-2"><span className="font-semibold">Time</span><span className="text-neutral-300">{Math.floor(time)}</span></div>
      </div>
    </div>
  );
}
