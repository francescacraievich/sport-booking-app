import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Shows nothing while auth is loading (avoids flash-redirect to /login).
 * Redirects to /login if the user is not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
