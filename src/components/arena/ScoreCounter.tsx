import { useEffect, useRef, useState } from 'react';

interface ScoreCounterProps {
  value: number;
  bounce: boolean;
}

export default function ScoreCounter({ value, bounce }: ScoreCounterProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const duration = 500;
    const startTime = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
        Score
      </span>
      <span
        className={`text-4xl font-black tabular-nums text-amber-400 transition-transform duration-300 ${
          bounce ? 'animate-[scorebounce_0.5s_ease]' : ''
        }`}
        style={{ textShadow: '0 0 20px rgba(245,158,11,0.5)' }}
      >
        {display}
      </span>
    </div>
  );
}
