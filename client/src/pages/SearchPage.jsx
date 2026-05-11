import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const [fields, tournaments, teams, players] = await Promise.all([
        api.getFields(q),
        api.getTournaments(q),
        api.getTeams(q),
        api.getPlayersSearch(q),
      ]);
      setResults({ fields, tournaments, teams, players });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
    await runSearch(query);
  };

  const total = results
    ? results.fields.length + results.tournaments.length + results.teams.length + results.players.length
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Ricerca globale</h1>
        <p className="page-subtitle">Cerca campi, tornei, squadre e giocatori</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="Inserisci il termine di ricerca..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Ricerca...' : 'Cerca'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {results && (
        <div className="search-results">
          <p className="results-summary">
            {total === 0
              ? `Nessun risultato per "${query}"`
              : `${total} risultati per "${query}"`}
          </p>

          {results.fields.length > 0 && (
            <section className="results-section">
              <h2 className="results-section-title">🏟 Campi ({results.fields.length})</h2>
              {results.fields.map((f) => (
                <Link key={f.id} to={`/fields/${f.id}`} className="result-item">
                  <span className={`badge badge-${f.sport_type}`}>{SPORT_LABEL[f.sport_type]}</span>
                  <div className="result-text">
                    <strong>{f.name}</strong>
                    <span className="muted"> — {f.address}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.tournaments.length > 0 && (
            <section className="results-section">
              <h2 className="results-section-title">🏆 Tornei ({results.tournaments.length})</h2>
              {results.tournaments.map((t) => (
                <Link key={t.id} to={`/tournaments/${t.id}`} className="result-item">
                  <span className={`badge badge-${t.sport}`}>{SPORT_LABEL[t.sport]}</span>
                  <div className="result-text">
                    <strong>{t.name}</strong>
                    <span className="muted"> — {t.creator_username}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.teams.length > 0 && (
            <section className="results-section">
              <h2 className="results-section-title">👥 Squadre ({results.teams.length})</h2>
              {results.teams.map((t) => (
                <Link key={t.id} to={`/tournaments/${t.tournament_id}`} className="result-item">
                  <span className={`badge badge-${t.sport}`}>{SPORT_LABEL[t.sport]}</span>
                  <div className="result-text">
                    <strong>{t.name}</strong>
                    <span className="muted"> — {t.tournament_name}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.players.length > 0 && (
            <section className="results-section">
              <h2 className="results-section-title">⚽ Giocatori ({results.players.length})</h2>
              {results.players.map((p) => (
                <Link key={p.id} to={`/tournaments/${p.tournament_id}`} className="result-item">
                  <span className={`badge badge-${p.sport}`}>{SPORT_LABEL[p.sport]}</span>
                  <div className="result-text">
                    <strong>
                      {p.name} {p.surname}
                    </strong>
                    {p.jersey_number && <span className="muted"> #{p.jersey_number}</span>}
                    <span className="muted"> — {p.team_name} ({p.tournament_name})</span>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
