import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getHttpErrorDetail, getHttpErrorStatus } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app/AppLogo';

export default function LoginPage() {
  const { user, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.approved) {
      navigate('/leaderboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      const status = await getHttpErrorStatus(err);
      const detail = await getHttpErrorDetail(err);
      if (status === 403 && detail?.toLowerCase().includes('pending')) {
        setError("El teu compte està pendent d'aprovació. Torna-ho a provar quan un administrador t'hagi acceptat.");
      } else if (status === 403) {
        setError('El teu compte ha estat desactivat.');
      } else {
        setError('Correu electrònic o contrasenya incorrectes. Torna-ho a provar.');
      }
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
          <p className="mt-1 text-sm text-muted-foreground">Prediccions del Mundial de Futbol 2026</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-5 text-lg font-semibold">Iniciar sessió</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Correu electrònic
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
                Contrasenya
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                autoComplete="current-password"
                required
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
              {isSubmitting ? 'Iniciant sessió…' : 'Iniciar sessió'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            No tens compte?{' '}
            <Link to="/register" className="font-medium text-wc-red hover:underline">
              Registra't
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
