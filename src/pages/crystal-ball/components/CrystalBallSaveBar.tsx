import { StickySaveBar } from '@/components/app/StickySaveBar';

type CrystalBallSaveBarProps = {
  pendingCount: number;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
};

export function CrystalBallSaveBar({
  pendingCount,
  saving,
  saveError,
  onSave,
}: CrystalBallSaveBarProps) {
  return (
    <StickySaveBar
      hint={
        pendingCount === 0
          ? 'Completa almenys una pregunta per guardar.'
          : `${pendingCount} pregunta${pendingCount === 1 ? '' : 'es'} per guardar`
      }
      saveLabel="Guardar prediccions"
      saving={saving}
      saveError={saveError}
      onSave={onSave}
      disabled={pendingCount === 0}
    />
  );
}
