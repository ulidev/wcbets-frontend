import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/app/AuthGuard';
import { ApprovalGuard } from '@/components/app/ApprovalGuard';
import { Layout } from '@/components/app/Layout';
import LoginPage from '@/pages/login/LoginPage';
import RegisterPage from '@/pages/register/RegisterPage';
import PendingApprovalPage from '@/pages/pending-approval/PendingApprovalPage';
import LeaderboardPage from '@/pages/leaderboard/LeaderboardPage';
import MatchesPage from '@/pages/matches/MatchesPage';
import PickemPage from '@/pages/pickem/PickemPage';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center py-24 text-muted-foreground">
      <p className="text-sm">{title} — coming soon</p>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Authenticated tree (token required)
  {
    element: <AuthGuard />,
    children: [
      // Pending approval — accessible without being approved
      { path: '/pending-approval', element: <PendingApprovalPage /> },

      // Approved users + layout
      {
        element: <ApprovalGuard />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <Navigate to="/leaderboard" replace /> },
              { path: '/leaderboard', element: <LeaderboardPage /> },
              { path: '/matches', element: <MatchesPage /> },
              { path: '/pickem', element: <PickemPage /> },
              { path: '/crystal-ball', element: <ComingSoon title="Crystal Ball" /> },
              { path: '/profile', element: <ComingSoon title="Profile" /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
