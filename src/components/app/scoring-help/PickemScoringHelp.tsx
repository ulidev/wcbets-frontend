import { ScoringHelpButton } from '@/components/app/ScoringHelpButton';
import { HelpExample, HelpRule, PointsLine } from './ScoringHelpBits';
import { HelpBracketSemiExample, HelpGroupResultCard } from './ScoringHelpVisuals';

const GROUP_A_PREDICTION = [
  { name: 'South Africa', label: 'Sud-àfrica', predictedPosition: 1, actualPosition: 2, points: 3 },
  { name: 'Mexico', label: 'Mèxic', predictedPosition: 2, actualPosition: 1, points: 3 },
  { name: 'South Korea', label: 'Corea del Sud', predictedPosition: 3, actualPosition: 3, points: 5 },
  { name: 'Czech Republic', label: 'República Txeca', predictedPosition: 4, actualPosition: 4, points: 5 },
] as const;

const GROUP_SECTIONS = [
  {
    id: 'group-rules',
    label: 'Regles',
    content: (
      <div className="flex flex-col gap-3">
        <HelpRule>
          Sistema 0/5/3 per equip al predir l&apos;ordre final de cada grup de 4 equips.
        </HelpRule>
        <HelpExample label="Punts per posició">
          <PointsLine label="Posició exacta (1r, 2n, 3r o 4t)" value="+5" highlight />
          <PointsLine label="Intercanvi només 1r ↔ 2n" value="+3" />
          <PointsLine label="Qualsevol altre error" value="0" />
          <PointsLine label="Bonus grup perfecte (4 exactes)" value="+5 extra" highlight />
        </HelpExample>
        <p className="text-xs">
          Màxim per grup: 25 pts (20 + bonus). Màxim total fase de grups: 300 pts.
        </p>
      </div>
    ),
  },
  {
    id: 'group-example',
    label: 'Predicció vs resultat',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Resultat real del Grup A: Mèxic · Sud-àfrica · Corea del Sud · República Txeca.
        </p>
        <HelpGroupResultCard groupName="Grup A" totalPoints={16} teams={[...GROUP_A_PREDICTION]} />
        <div className="flex flex-col gap-1">
          <PointsLine label="Sud-àfrica/Mèxic intercanvi 1r↔2n" value="+3 +3" />
          <PointsLine label="Corea i Txeca posició exacta" value="+5 +5" />
          <PointsLine label="Total grup" value="16 pts" highlight />
        </div>
      </div>
    ),
  },
];

const BRACKET_SECTIONS = [
  {
    id: 'bracket-rules',
    label: 'Com funciona',
    content: (
      <div className="flex flex-col gap-3">
        <HelpRule>
          Abans de començar l&apos;eliminatòria, tries el guanyador de{' '}
          <span className="font-semibold text-foreground">cada slot</span> del bracket. Cada partit
          es puntua per separat: encertar o no un slot no afecta els altres.
        </HelpRule>
        <HelpExample label="Punts per ronda">
          <PointsLine label="Setzenes de final (RO32)" value="+5" />
          <PointsLine label="Vuitens de final" value="+10" />
          <PointsLine label="Quarts de final" value="+15" />
          <PointsLine label="Semifinals" value="+20" />
          <PointsLine label="Final" value="+30" highlight />
        </HelpExample>
        <p className="text-xs leading-relaxed">
          Bonus ronda perfecta: +10 si encertes tots els partits d&apos;una ronda (excepte la final).
          El bonus es suma al primer partit de la ronda.
        </p>
        <p className="text-xs leading-relaxed">
          Si fallas un partit intermedi (p. ex. semifinal), encara pots sumar punts a la final o en
          qualsevol altre slot on encertis el guanyador.
        </p>
      </div>
    ),
  },
  {
    id: 'bracket-semi',
    label: 'Semifinals',
    content: (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Exemple: encertes Espanya–França, fallas Argentina–Anglaterra, però a la final encertes
          Espanya.
        </p>
        <HelpBracketSemiExample />
      </div>
    ),
  },
];

export function PickemScoringHelp() {
  return (
    <ScoringHelpButton
      title="Pick'em — Puntuació (v3)"
      sectionGroups={[
        { id: 'groups', label: 'Fase de grups', sections: GROUP_SECTIONS },
        { id: 'bracket', label: 'Bracket', sections: BRACKET_SECTIONS },
      ]}
    />
  );
}
