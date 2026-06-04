import { ChevronLeft, ChevronRight } from 'lucide-react';

type BracketMobileJumpProps = {
  onJumpLeft: () => void;
  onJumpRight: () => void;
};

export function BracketMobileJump({ onJumpLeft, onJumpRight }: BracketMobileJumpProps) {
  return (
    <div className="bracket-mobile-jump md:hidden">
      <button type="button" onClick={onJumpLeft} className="bracket-mobile-jump-btn">
        <ChevronLeft className="h-4 w-4" />
        Izquierda
      </button>
      <button type="button" onClick={onJumpRight} className="bracket-mobile-jump-btn">
        Derecha
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
