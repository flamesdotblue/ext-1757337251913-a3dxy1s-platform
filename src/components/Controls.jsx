import { Keyboard, Gamepad2 } from 'lucide-react';

export default function Controls() {
  return (
    <div className="flex items-center gap-3 text-slate-300 bg-slate-800/60 ring-1 ring-white/10 px-3 py-2 rounded-lg">
      <Keyboard className="w-4 h-4" />
      <div className="text-sm">Arrows or WASD to move, Space to jump</div>
      <Gamepad2 className="w-4 h-4 opacity-70" />
    </div>
  );
}
