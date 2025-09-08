import Spline from '@splinetool/react-spline';

export default function Hero() {
  return (
    <section className="relative w-full" style={{ height: '60vh' }}>
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/EFlEghJH3qCmzyRi/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black pointer-events-none" />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Mario-Inspired Pixel Platformer
          </h1>
          <p className="mt-3 text-neutral-300">
            A tiny canvas game built with React + Vite. Jump into a nostalgic world and grab those coins!
          </p>
        </div>
      </div>
    </section>
  );
}
