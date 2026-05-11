import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

const STATUS_LABEL = { upcoming: 'In arrivo', active: 'In corso', completed: 'Concluso' };
const STATUS_CLASS = { upcoming: 'badge-upcoming', active: 'badge-active', completed: 'badge-played' };

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    // Debounce: wait 300ms after user stops typing before searching
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api
        .getTournaments(query || undefined)
        .then((data) => {
          setTournaments(data);
          setError('');
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tornei</h1>
          <p className="page-subtitle">Gestisci e segui i tornei amatoriali</p>
        </div>
        {user && (
          <Link to="/tournaments/new" className="btn btn-primary">
            + Crea torneo
          </Link>
        )}
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Cerca per nome o sport..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Caricamento tornei...</div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          Nessun torneo trovato.
          {user && (
            <>
              {' '}
              <Link to="/tournaments/new" className="link">
                Crea il primo!
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {tournaments.map((t) => (
            <div key={t.id} className="card tournament-card">
              <div className="card-header">
                <span className={`badge badge-${t.sport}`}>{SPORT_LABEL[t.sport]}</span>
                <div className="card-header-right">
                  {t.status && (
                    <span className={`badge ${STATUS_CLASS[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  )}
                  <span className="card-meta">
                    {t.teams_count ?? 0}/{t.max_teams} squadre
                  </span>
                </div>
              </div>
              <h3 className="card-title">{t.name}</h3>
              <p className="card-subtitle">
                <span className="icon">👤</span> {t.creator_username}
                &nbsp;&nbsp;
                <span className="icon">📅</span> {formatDate(t.start_date)}
              </p>
              <Link to={`/tournaments/${t.id}`} className="btn btn-primary btn-sm card-action">
                Dettagli →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
