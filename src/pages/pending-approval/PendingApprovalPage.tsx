import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.approved) {
      navigate('/leaderboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold">Waiting for approval</h1>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Your account has been created and is awaiting admin approval. You&apos;ll be able to start
        making predictions once approved.
      </p>

      {user && (
        <p className="mt-4 text-sm font-medium">
          Signed in as{' '}
          <span className="text-primary">
            {user.first_name} {user.last_name}
          </span>
        </p>
      )}

      <button
        onClick={() => void handleLogout()}
        className="mt-8 flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
