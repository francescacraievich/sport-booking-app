import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FieldsPage from './pages/FieldsPage';
import FieldDetailPage from './pages/FieldDetailPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import TournamentFormPage from './pages/TournamentFormPage';
import UsersPage from './pages/UsersPage';
import BookingsPage from './pages/BookingsPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/fields" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/fields" element={<FieldsPage />} />
          <Route path="/fields/:id" element={<FieldDetailPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/new" element={
            <ProtectedRoute><TournamentFormPage mode="create" /></ProtectedRoute>
          } />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/tournaments/:id/edit" element={
            <ProtectedRoute><TournamentFormPage mode="edit" /></ProtectedRoute>
          } />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/bookings" element={
            <ProtectedRoute><BookingsPage /></ProtectedRoute>
          } />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/fields" replace />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
