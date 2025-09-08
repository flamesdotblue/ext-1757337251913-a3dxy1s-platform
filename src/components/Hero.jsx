import Spline from '@splinetool/react-spline';

export default function Hero() {
  return (
    <header className="relative w-full min-h-[70vh] md:min-h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/EFlEghJH3qCmzyRi/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-slate-950/90" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col items-start justify-center gap-6">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-rose-200/80 bg-rose-500/20 ring-1 ring-rose-300/30 px-3 py-1 rounded-full">
          Retro Platformer
        </span>
        <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          A 2D Pixel Mario-Inspired Game
        </h1>
        <p className="max-w-2xl text-slate-200/90 text-base md:text-lg">
          Jump into a tiny canvas world. Collect coins, dodge danger, and reach the flag. Powered by React and HTML Canvas.
        </p>
        <div className="flex items-center gap-3">
          <a href="#game" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-rose-500 hover:bg-rose-600 transition-colors text-white font-semibold shadow-lg shadow-rose-900/30">
            Play Now
          </a>
          <span className="text-slate-300">WASD/Arrows + Space</span>
        </div>
      </div>
    </header>
  );
}
