import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getUser(id)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Caricamento profilo...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!user) return null;

  return (
    <div className="page">
      <Link to="/users" className="back-link">
        ← Torna agli utenti
      </Link>

      <div className="card user-detail-card">
        <div className="user-info">
          <div className="user-avatar user-avatar-lg">
            {user.name[0]}{user.surname[0]}
          </div>
          <div>
            <h1 className="page-title">{user.name} {user.surname}</h1>
            <p className="user-username">@{user.username}</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Tornei creati</h2>
        {user.tournaments.length === 0 ? (
          <div className="empty-state">Nessun torneo creato.</div>
        ) : (
          <div className="card-grid">
            {user.tournaments.map((t) => (
              <Link key={t.id} to={`/tournaments/${t.id}`} className="card tournament-card">
                <div className="card-header">
                  <span className={`badge badge-${t.sport}`}>{SPORT_LABEL[t.sport]}</span>
                </div>
                <h3 className="card-title">{t.name}</h3>
                <span className="btn btn-primary btn-sm card-action">Dettagli →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
