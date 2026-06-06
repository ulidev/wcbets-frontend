export type IdealXILine = 'GK' | 'DEF' | 'MID' | 'FWD';

export type IdealXISlot = {
  selectionIndex: number;
  line: IdealXILine;
  uiLabel: string;
  /** 0–100, percentage from left */
  x: number;
  /** 0–100, percentage from top (attack = low y) */
  y: number;
};

export type IdealXIFormation = {
  id: string;
  label: string;
  slots: IdealXISlot[];
};

export type IdealXIPlayerCatalogEntry = {
  id: string;
  name: string;
  teamName: string;
  position: IdealXILine;
};

export type IdealXIAnswerDraft = {
  selection_index: number;
  player_id: string;
};
