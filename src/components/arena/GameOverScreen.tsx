import { Trophy, RotateCcw, Target, Repeat } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  correct: number;
  attempted: number;
  xp: number;
  isNewBest: boolean;
  previousBest: { score: number; date: string } | null;
  challengeResult?: string | null;
  onPlayAgain: () => void;
  onChallenge: () => void;
  onChangeSubject: () => void;
}

export default function GameOverScreen({
  score,
  correct,
  attempted,
  xp,
  isNewBest,
  previousBest,
  challengeResult,
  onPlayAgain,
  onChallenge,
  onChangeSubject,
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

          {challengeResult && (
            <div className="mb-5 w-full rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-200 animate-[slideup_0.5s_ease]">
              {challengeResult}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <Stat label="Correct" value={`${correct}/${attempted}`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="XP" value={`+${xp}`} accent />
          </div>

          {/* Your Best */}
          <div className="w-full mb-6">
            {isNewBest ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                <Trophy className="h-6 w-6 text-amber-400" />
                <span className="text-base font-black text-amber-300">🏆 New Personal Best!</span>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Your Best</div>
                <div className="text-lg font-black tabular-nums text-white">
                  {previousBest?.score ?? score}
                  {previousBest?.date && (
                    <span className="ml-2 text-xs font-semibold text-gray-500">on {previousBest.date}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onPlayAgain}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 font-bold text-white transition-all hover:from-purple-500 hover:to-purple-400 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] active:scale-95"
          >
            <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
            Play Again
          </button>

          <button
            onClick={onChallenge}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-500/50 bg-transparent px-6 py-3.5 font-bold text-purple-300 transition-all hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] active:scale-95"
          >
            <Target className="h-5 w-5" />
            Challenge a Friend 🎯
          </button>

          <button
            onClick={onChangeSubject}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 active:scale-95"
          >
            <Repeat className="h-4 w-4" />
            Change Subject
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
