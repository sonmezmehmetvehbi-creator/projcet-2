import { Trophy, RotateCcw, Zap } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  correct: number;
  attempted: number;
  xp: number;
  leaderboard: { name: string; score: number }[];
  onPlayAgain: () => void;
}

export default function GameOverScreen({
  score,
  correct,
  attempted,
  xp,
  leaderboard,
  onPlayAgain,
}: GameOverScreenProps) {
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[slideup_0.5s_ease]">
      <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#13131f] to-[#0a0a14] p-8 shadow-[0_0_60px_rgba(124,58,237,0.3)]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/40">
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Game Over</h2>
          <p className="text-sm text-gray-500 mt-1">Round complete</p>

          <div className="my-6 text-6xl font-black text-amber-400 tabular-nums" style={{ textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
            {score}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <Stat label="Correct" value={`${correct}/${attempted}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="XP" value={`+${xp}`} accent />
          </div>

          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Leaderboard</span>
              <Zap className="h-3 w-3 text-purple-400" />
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                    i === 0
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'bg-white/5 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-5 ${i === 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <span className={i === 0 ? 'text-amber-300 font-semibold' : 'text-gray-300'}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-gray-200">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onPlayAgain}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 font-bold text-white transition-all hover:from-purple-500 hover:to-purple-400 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] active:scale-95"
          >
            <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 px-2 py-3 text-center">
      <div className={`text-lg font-black tabular-nums ${accent ? 'text-purple-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}
