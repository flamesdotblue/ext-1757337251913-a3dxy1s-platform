export default function Controls() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur">
      <h3 className="mb-3 text-lg font-semibold">Controls</h3>
      <ul className="space-y-2 text-neutral-300">
        <li>Move: Left/Right Arrows or A/D</li>
        <li>Jump: Space or W/Up Arrow</li>
        <li>Reset Level: R</li>
      </ul>
      <p className="mt-4 text-sm text-neutral-400">
        Tip: Try collecting all coins. Watch out for gaps!
      </p>
    </div>
  );
}
