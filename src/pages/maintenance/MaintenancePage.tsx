import { Wrench } from 'lucide-react';
import { AppLogo } from '@/components/app/AppLogo';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex justify-center">
        <AppLogo size={72} />
      </div>

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Wrench className="h-8 w-8 text-primary" />
      </div>

      <h1 className="wc-page-title text-3xl">En manteniment</h1>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Estem fent millores. Torna a intentar-ho en uns minuts.
      </p>
    </div>
  );
}
