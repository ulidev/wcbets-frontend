import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/app/AuthGuard';
import { ApprovalGuard } from '@/components/app/ApprovalGuard';
import { Layout } from '@/components/app/Layout';
import LoginPage from '@/pages/login/LoginPage';
import RegisterPage from '@/pages/register/RegisterPage';
import PendingApprovalPage from '@/pages/pending-approval/PendingApprovalPage';
import LeaderboardPage from '@/pages/leaderboard/LeaderboardPage';
import LeaderboardUserPage from '@/pages/leaderboard/LeaderboardUserPage';
import MatchesPage from '@/pages/matches/MatchesPage';
import PickemPage from '@/pages/pickem/PickemPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import CrystalBallPage from '@/pages/crystal-ball/CrystalBallPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/pending-approval', element: <PendingApprovalPage /> },

  // Authenticated tree (token required)
  {
    element: <AuthGuard />,
    children: [
      {
        element: <ApprovalGuard />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <Navigate to="/leaderboard" replace /> },
              { path: '/leaderboard', element: <LeaderboardPage /> },
              { path: '/leaderboard/user/:userId', element: <LeaderboardUserPage /> },
              { path: '/matches', element: <MatchesPage /> },
              { path: '/pickem', element: <PickemPage /> },
              { path: '/crystal-ball', element: <CrystalBallPage /> },
              { path: '/profile', element: <ProfilePage /> },
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
