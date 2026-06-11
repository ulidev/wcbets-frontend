import type { Blocker } from 'react-router-dom';

type UnsavedChangesDialogProps = {
  blocker: Blocker;
};

export function UnsavedChangesDialog({ blocker }: UnsavedChangesDialogProps) {
  if (blocker.state !== 'blocked') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center safe-area-pb">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="unsaved-changes-title"
        className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 id="unsaved-changes-title" className="wc-section-heading text-base">
          Canvis sense guardar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tens prediccions editades que encara no has enviat. Si surts ara, es perdran.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => blocker.reset?.()}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            Continuar editant
          </button>
          <button
            type="button"
            onClick={() => blocker.proceed?.()}
            className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground"
          >
            Sortir sense guardar
          </button>
        </div>
      </div>
    </div>
  );
}
