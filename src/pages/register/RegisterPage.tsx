import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { register } from '@/api/auth';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app/AppLogo';

export default function RegisterPage() {
  const { user, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.approved ? '/leaderboard' : '/pending-approval', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ email, first_name: firstName, last_name: lastName, password });
      // Auto-login after registration
      await login({ email, password });
      // useAuth will trigger redirect via the effect above
    } catch {
      setError('Registration failed. The email may already be in use.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <AppLogo size={72} />
          </div>
          <h1 className="wc-page-title text-2xl">WC Bets</h1>
          <p className="mt-1 text-sm text-muted-foreground">FIFA World Cup 2026 Predictions</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-5 text-lg font-semibold">Create account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  placeholder="Alex"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  placeholder="Smith"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'wc-btn-primary w-full',
                isSubmitting ? 'opacity-60' : 'hover:opacity-90',
              )}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
