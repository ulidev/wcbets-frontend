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

      <h1 className="text-2xl font-bold">Your account is pending approval</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        We&apos;ve received your registration for{' '}
        <span className="font-semibold text-wc-card-text">{displayName}</span>. An admin must
        approve your account before you can sign in and start making predictions.
      </p>
      <p className="mt-2 max-w-sm text-xs text-muted-foreground">
        Once approved, come back here and sign in with{' '}
        <span className="font-medium text-wc-hermes">{state.email}</span>.
      </p>

      <Link
        to="/login"
        className="wc-btn-primary mt-8 inline-flex items-center justify-center px-6 py-2.5 text-sm"
      >
        Back to sign in
      </Link>
    </div>
  );
}
