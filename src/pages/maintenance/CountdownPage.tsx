import { useEffect, useState } from 'react';
import { AppLogo } from '@/components/app/AppLogo';

// June 9 2026, 21:00 CEST (UTC+2)
const RELEASE_DATE = new Date('2026-06-09T19:00:00Z');

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, RELEASE_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-wc-bold tabular-nums text-5xl leading-none text-primary sm:text-6xl">
        {pad(value)}
      </span>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
  const isLive = RELEASE_DATE.getTime() <= Date.now();

  useEffect(() => {
    if (isLive) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1_000);
    return () => clearInterval(id);
  }, [isLive]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-8 flex justify-center">
        <AppLogo size={72} />
      </div>

      <h1 className="wc-page-title text-3xl sm:text-4xl">WC Bets 2026</h1>
      <p className="mt-2 text-sm text-muted-foreground">Prediccions del Mundial de Futbol 2026</p>

      {isLive ? (
        <p className="mt-10 text-lg font-semibold text-primary">Ja estem en línia! Refresca la pàgina.</p>
      ) : (
        <>
          <p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">
            Llançament en
          </p>

          <div className="mt-4 flex items-start gap-5 sm:gap-8">
            <Unit value={timeLeft.days} label="dies" />
            <span className="mt-2 text-3xl font-light text-muted-foreground">:</span>
            <Unit value={timeLeft.hours} label="hores" />
            <span className="mt-2 text-3xl font-light text-muted-foreground">:</span>
            <Unit value={timeLeft.minutes} label="min" />
            <span className="mt-2 text-3xl font-light text-muted-foreground">:</span>
            <Unit value={timeLeft.seconds} label="seg" />
          </div>

          <p className="mt-8 max-w-xs text-sm text-muted-foreground">
            Prepara&apos;t per fer les teves prediccions de cada partit del Mundial 2026.
          </p>
        </>
      )}
    </div>
  );
}
