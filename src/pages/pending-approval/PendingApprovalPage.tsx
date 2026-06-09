import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

type PendingApprovalState = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

export default function PendingApprovalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as PendingApprovalState | null) ?? null;

  if (!state?.email) {
    navigate('/login', { replace: true });
    return null;
  }

  const displayName =
    state.firstName && state.lastName
      ? `${state.firstName} ${state.lastName}`
      : state.email;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-wc-hermes/10">
        <Clock className="h-8 w-8 text-wc-hermes" />
      </div>

      <h1 className="text-2xl font-bold">El teu compte està pendent d'aprovació</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Hem rebut el registre de{' '}
        <span className="font-semibold text-wc-card-text">{displayName}</span>. Un administrador ha
        d'aprovar el teu compte abans que puguis iniciar sessió i fer prediccions.
      </p>
      <p className="mt-2 max-w-sm text-xs text-muted-foreground">
        Un cop aprovat, torna aquí i inicia sessió amb{' '}
        <span className="font-medium text-wc-hermes">{state.email}</span>.
      </p>

      <Link
        to="/login"
        className="wc-btn-primary mt-8 inline-flex items-center justify-center px-6 py-2.5 text-sm"
      >
        Tornar a l'inici de sessió
      </Link>
    </div>
  );
}
