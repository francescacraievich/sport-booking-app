import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/fields');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/fields" className="navbar-brand" onClick={close}>
          SportBooking
        </NavLink>

        <div className="navbar-center">
          <NavLink to="/fields" className={navLinkClass}>Campi</NavLink>
          <NavLink to="/tournaments" className={navLinkClass}>Tornei</NavLink>
          <NavLink to="/users" className={navLinkClass}>Utenti</NavLink>
          <NavLink to="/search" className={navLinkClass}>Cerca</NavLink>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <NavLink to="/bookings" className={navLinkClass}>
                Le mie prenotazioni
              </NavLink>
              <span className="nav-username">Ciao, {user.name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Esci
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>Accedi</NavLink>
              <NavLink to="/signup" className="btn btn-light btn-sm">Registrati</NavLink>
            </>
          )}
        </div>

        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <NavLink to="/fields" className={navLinkClass} onClick={close}>Campi</NavLink>
          <NavLink to="/tournaments" className={navLinkClass} onClick={close}>Tornei</NavLink>
          <NavLink to="/users" className={navLinkClass} onClick={close}>Utenti</NavLink>
          <NavLink to="/search" className={navLinkClass} onClick={close}>Cerca</NavLink>
          {user ? (
            <>
              <NavLink to="/bookings" className={navLinkClass} onClick={close}>
                Le mie prenotazioni
              </NavLink>
              <div className="mobile-menu-user">
                <span className="nav-username">Ciao, {user.name}</span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Esci
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={close}>Accedi</NavLink>
              <NavLink to="/signup" className={navLinkClass} onClick={close}>Registrati</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
