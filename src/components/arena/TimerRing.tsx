interface TimerRingProps {
  secondsLeft: number;
  totalSeconds: number;
}

export default function TimerRing({ secondsLeft, totalSeconds }: TimerRingProps) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, secondsLeft / totalSeconds);
  const dashOffset = circumference * (1 - progress);

  const color =
    secondsLeft <= 10 ? '#ef4444' : secondsLeft <= 20 ? '#f59e0b' : '#22c55e';

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#1e1e2e"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      </svg>
      <span
        className={`absolute text-sm font-bold tabular-nums transition-colors duration-300 ${
          secondsLeft <= 10 ? 'text-red-400' : 'text-white'
        }`}
      >
        {display}
      </span>
    </div>
  );
}
