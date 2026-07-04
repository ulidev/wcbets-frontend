import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';

export function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="not-first:mt-3 not-first:border-t not-first:border-border not-first:pt-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground">{title}</p>
      {children}
    </section>
  );
}

export function HelpRule({ children }: { children: React.ReactNode }) {
  return <p className="mb-2">{children}</p>;
}

export function HelpExample({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-3.5">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}

export function MatchTeams({
  home,
  away,
  score,
  className,
}: {
  home: string;
  away: string;
  score?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-1', className)}>
      <span className="flex items-center gap-1 font-semibold text-foreground">
        <TeamFlag teamName={home} size="sm" />
        {home}
      </span>
      {score != null && (
        <span className="tabular-nums font-bold text-foreground">{score}</span>
      )}
      <span className="flex items-center gap-1 font-semibold text-foreground">
        <TeamFlag teamName={away} size="sm" />
        {away}
      </span>
    </div>
  );
}

export function PointsLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <p className={cn('flex items-center justify-between gap-2', highlight && 'font-semibold text-foreground')}>
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </p>
  );
}

export function GroupOrderExample({
  teams,
}: {
  teams: { name: string; predicted: number; actual: number; pts: number }[];
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {teams.map((t) => (
        <li key={t.name} className="flex items-center gap-2">
          <TeamFlag teamName={t.name} size="sm" />
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{t.name}</span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            #{t.predicted}→#{t.actual}
          </span>
          <span
            className={cn(
              'shrink-0 text-[10px] font-bold tabular-nums',
              t.pts > 0 ? 'text-wc-green' : 'text-muted-foreground',
            )}
          >
            {t.pts > 0 ? `+${t.pts}` : '0'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BracketPickExample({
  home,
  away,
  pick,
  winner,
  pts,
  bonus,
}: {
  home: string;
  away: string;
  pick: string;
  winner: string;
  pts: number;
  bonus?: number;
}) {
  const correct = pick === winner;
  return (
    <div className="flex flex-col gap-1.5">
      <MatchTeams home={home} away={away} />
      <p>
        La teva pick:{' '}
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <TeamFlag teamName={pick} size="sm" />
          {pick}
        </span>
        {' · '}
        Guanyador:{' '}
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <TeamFlag teamName={winner} size="sm" />
          {winner}
        </span>
      </p>
      <PointsLine
        label={correct ? 'Partit encertat' : 'Partit fallat'}
        value={correct ? `+${pts}` : '0'}
        highlight
      />
      {bonus != null && correct && (
        <PointsLine label="Bonus ronda perfecta" value={`+${bonus}`} />
      )}
    </div>
  );
}
