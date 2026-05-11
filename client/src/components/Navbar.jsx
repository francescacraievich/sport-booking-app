import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/fields');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/fields" className="navbar-brand">
          ⚽ SportBooking
        </NavLink>

        <div className="navbar-center">
          <NavLink to="/fields" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Campi
          </NavLink>
          <NavLink to="/tournaments" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Tornei
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Utenti
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Cerca
          </NavLink>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <NavLink
                to="/bookings"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              >
                Le mie prenotazioni
              </NavLink>
              <span className="nav-username">Ciao, {user.name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Esci
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                Accedi
              </NavLink>
              <NavLink to="/signup" className="btn btn-light btn-sm">
                Registrati
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
