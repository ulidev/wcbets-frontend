import { cn } from '@/lib/utils';
import { TeamFlag } from '@/components/app/TeamFlag';
import {
  getResultAccuracyTier,
  mvpCorrectToTone,
  MVP_SECTION_STYLES,
  POINT_CHIP_STYLES,
  resultTierToTone,
  RESULT_SECTION_STYLES,
  RESULT_TEXT_STYLES,
  type AccuracyTone,
} from '@/lib/match-prediction-score';
import type { components } from '@/types/api';

type MatchPrediction = components['schemas']['MatchPredictionResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];

function PointChip({ label, pts, tone }: { label: string; pts: number; tone: AccuracyTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        POINT_CHIP_STYLES[tone],
      )}
    >
      {label}
      <span className="font-bold tabular-nums">{pts > 0 ? `+${pts}` : '0'}</span>
    </span>
  );
}

export interface MatchPredictionBreakdownProps {
  match: components['schemas']['MatchResponse'];
  prediction: MatchPrediction;
  scoreLabel?: string;
  pickedMvp?: PlayerResponse | null;
  pickedTeam?: string | null;
  officialMvp?: PlayerResponse | null;
  officialTeam?: string | null;
}

export function MatchPredictionBreakdown({
  match,
  prediction,
  scoreLabel = 'La teva predicció',
  pickedMvp = null,
  pickedTeam = null,
  officialMvp = null,
  officialTeam = null,
}: MatchPredictionBreakdownProps) {
  const resultTier = getResultAccuracyTier(
    match.home_goals,
    match.away_goals,
    prediction.home_goals,
    prediction.away_goals,
  );
  const resultTone = resultTierToTone(resultTier);
  const mvpCorrect =
    pickedMvp != null && officialMvp != null && pickedMvp.id === officialMvp.id;
  const mvpTone = mvpCorrectToTone(mvpCorrect);

  return (
    <div className="flex flex-col border-t border-border">
      <div
        className={cn(
          'flex items-center justify-between border-t px-4 py-2.5 first:border-t-0',
          RESULT_SECTION_STYLES[resultTier],
        )}
      >
        <span className="text-xs text-muted-foreground">{scoreLabel}</span>
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold tabular-nums text-sm', RESULT_TEXT_STYLES[resultTier])}>
            {prediction.home_goals}&nbsp;–&nbsp;{prediction.away_goals}
          </span>
          <PointChip label="Resultat" pts={prediction.result_pts_awarded} tone={resultTone} />
        </div>
      </div>

      {pickedMvp && pickedTeam && (
        <div
          className={cn(
            'flex items-center justify-between border-t px-4 py-2.5',
            mvpCorrect ? MVP_SECTION_STYLES.correct : MVP_SECTION_STYLES.wrong,
          )}
        >
          <span className="text-xs text-muted-foreground">MVP</span>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-1 gap-y-0.5">
              <TeamFlag teamName={pickedTeam} size="sm" />
              <span
                className={cn(
                  'text-xs font-semibold',
                  mvpCorrect ? 'text-wc-green' : 'text-red-500',
                )}
              >
                {pickedMvp.name}
              </span>
              {!mvpCorrect && officialMvp && officialTeam && (
                <>
                  <TeamFlag teamName={officialTeam} size="sm" />
                  <span className="text-xs text-wc-hermes">{officialMvp.name}</span>
                </>
              )}
            </div>
            <PointChip label="MVP" pts={prediction.mvp_pts_awarded} tone={mvpTone} />
          </div>
        </div>
      )}
    </div>
  );
}
