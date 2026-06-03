import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ApprovalGuard() {
  const { user } = useAuth();

  if (!user?.approved) return <Navigate to="/pending-approval" replace />;

  return <Outlet />;
}
