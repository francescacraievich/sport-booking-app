import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getUsers(query || undefined)
      .then((data) => {
        setUsers(data);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utenti</h1>
          <p className="page-subtitle">Esplora i profili e i tornei creati</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Cerca per username, nome o cognome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Caricamento utenti...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">Nessun utente trovato.</div>
      ) : (
        <div className="users-list">
          {users.map((u) => (
            <div key={u.id} className="card user-card">
              <div className="user-info">
                <div className="user-avatar">{u.name[0]}{u.surname[0]}</div>
                <div>
                  <h3 className="user-name">
                    {u.name} {u.surname}
                  </h3>
                  <p className="user-username">@{u.username}</p>
                </div>
              </div>
              {u.tournaments.length > 0 ? (
                <div className="user-tournaments">
                  <p className="user-tournaments-label">Tornei creati:</p>
                  <div className="tournament-tags">
                    {u.tournaments.map((t) => (
                      <Link key={t.id} to={`/tournaments/${t.id}`} className="tournament-tag">
                        <span className={`badge-dot badge-dot-${t.sport}`} />
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-tournaments">Nessun torneo creato</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
