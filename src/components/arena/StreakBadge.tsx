interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 3) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 animate-[streakpop_0.4s_ease]">
      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-600/30 to-red-600/30 border border-orange-500/50 px-5 py-2 backdrop-blur-md">
        <span className="text-xl animate-[firepulse_1s_ease-in-out_infinite]">🔥</span>
        <span className="text-sm font-bold text-orange-300">
          {streak} in a row!
        </span>
      </div>
    </div>
  );
}
