import { ScoringHelpButton } from '@/components/app/ScoringHelpButton';
import { HelpExample, HelpRule, PointsLine } from './ScoringHelpBits';
import { HelpMatchCard } from './ScoringHelpVisuals';

const FAVORITE_ODDS = { home: 1.0, draw: 1.33, away: 1.67 };
const OUTSIDER_ODDS = { home: 1.8, draw: 1.4, away: 1.05 };

export function MatchScoringHelp() {
  return (
    <ScoringHelpButton
      title="Puntuació Partits (v3)"
      sections={[
        {
          id: 'rules',
          label: 'Regles',
          content: (
            <div className="flex flex-col gap-3">
              <HelpRule>
                Resultat (excloents): tendència 2 pts · diferència de gols 4 pts · marcador exacte
                6 pts. A fase de grups es multiplica per ×0,8. El MVP suma +2 (fix, sense
                multiplicador de ronda ni d&apos;odds).
              </HelpRule>
              <HelpExample label="Multiplicadors de ronda">
                <PointsLine label="Fase de grups" value="×0,8" />
                <PointsLine label="Vuitens de final" value="×2" />
                <PointsLine label="Quarts" value="×4" />
                <PointsLine label="Semis" value="×5" />
                <PointsLine label="Final" value="×6" highlight />
              </HelpExample>
            </div>
          ),
        },
        {
          id: 'partial-mvp',
          label: 'Parcial + MVP',
          content: (
            <div className="flex flex-col gap-3">
              <HelpMatchCard
                metaLine="Jornada 1 · Fase de grups"
                homeTeam="Mexico"
                awayTeam="South Africa"
                homeTeamLabel="Mèxic"
                awayTeamLabel="Sud-àfrica"
                homeGoals={2}
                awayGoals={1}
                predHome={3}
                predAway={1}
                pointsLabel="+3,6 pts"
                cardStyle="bg-amber-500/10"
                pointsStyle="text-amber-600"
                oddsMultipliers={FAVORITE_ODDS}
                oddsActive="home"
              />
              <p className="text-xs sm:text-sm">
                Vas encertar qui guanya i el MVP, però no la diferència de gols ni el marcador
                exacte.
              </p>
              <div className="flex flex-col gap-1">
                <PointsLine label="Tendència (2 × 1,0 × 0,8)" value="1,6 pts" />
                <PointsLine label="MVP encertat" value="+2 pts" />
                <PointsLine label="Total" value="3,6 pts" highlight />
              </div>
            </div>
          ),
        },
        {
          id: 'exact-no-mvp',
          label: 'Exacte sense MVP',
          content: (
            <div className="flex flex-col gap-3">
              <HelpMatchCard
                metaLine="Jornada 1 · Fase de grups"
                homeTeam="Mexico"
                awayTeam="South Africa"
                homeTeamLabel="Mèxic"
                awayTeamLabel="Sud-àfrica"
                homeGoals={2}
                awayGoals={1}
                predHome={2}
                predAway={1}
                pointsLabel="+4,8 pts"
                cardStyle="bg-amber-500/10"
                pointsStyle="text-amber-600"
                oddsMultipliers={FAVORITE_ODDS}
                oddsActive="home"
              />
              <p className="text-xs sm:text-sm">
                Vas clavar el marcador, però el MVP predit no coincideix amb el del partit.
              </p>
              <div className="flex flex-col gap-1">
                <PointsLine label="Marcador exacte (6 × 1,0 × 0,8)" value="4,8 pts" highlight />
                <PointsLine label="MVP fallat" value="0 pts" />
                <PointsLine label="Total" value="4,8 pts" highlight />
              </div>
            </div>
          ),
        },
        {
          id: 'odds-high',
          label: 'Odds altes',
          content: (
            <div className="flex flex-col gap-3">
              <HelpMatchCard
                metaLine="Setzens de final"
                homeTeam="Morocco"
                awayTeam="Portugal"
                homeTeamLabel="Marroc"
                awayTeamLabel="Portugal"
                homeGoals={2}
                awayGoals={1}
                predHome={2}
                predAway={1}
                pointsLabel="+32,4 pts"
                cardStyle="bg-wc-green/10"
                pointsStyle="text-wc-green"
                oddsMultipliers={OUTSIDER_ODDS}
                oddsActive="home"
              />
              <p className="text-xs sm:text-sm">
                Vas predir victòria de{' '}
                <span className="font-semibold text-foreground">Marroc</span> amb marcador exacte i
                multiplicador ×1,8.
              </p>
              <div className="flex flex-col gap-1">
                <PointsLine label="Marcador exacte (6 × 1,8 × 3)" value="32,4 pts" highlight />
                <PointsLine label="MVP (si l&apos;encertes)" value="+2 pts" />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
