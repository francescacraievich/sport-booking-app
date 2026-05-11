import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SPORTS = [
  { value: 'football', label: 'Calcio' },
  { value: 'volleyball', label: 'Pallavolo' },
  { value: 'basketball', label: 'Basket' },
];

export default function TournamentFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    sport: 'football',
    max_teams: '',
    start_date: '',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit') {
      api
        .getTournament(id)
        .then((t) => {
          if (t.creator_id !== user.id) {
            navigate(`/tournaments/${id}`);
            return;
          }
          setForm({
            name: t.name,
            sport: t.sport,
            max_teams: String(t.max_teams),
            start_date: new Date(t.start_date).toISOString().split('T')[0],
          });
        })
        .catch(() => setError('Torneo non trovato.'))
        .finally(() => setLoading(false));
    }
  }, [id, mode, user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, sport, max_teams, start_date } = form;
    if (!name || !sport || !max_teams || !start_date) {
      setError('Compila tutti i campi');
      return;
    }
    if (parseInt(max_teams) < 2) {
      setError('Il numero massimo di squadre deve essere almeno 2');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { name, sport, max_teams: parseInt(max_teams), start_date };
      if (mode === 'create') {
        const t = await api.createTournament(payload);
        navigate(`/tournaments/${t.id}`);
      } else {
        await api.updateTournament(id, { name, max_teams: parseInt(max_teams), start_date });
        navigate(`/tournaments/${id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Caricamento...</div>;

  const isEdit = mode === 'edit';

  return (
    <div className="page">
      <Link to={isEdit ? `/tournaments/${id}` : '/tournaments'} className="back-link">
        ← {isEdit ? 'Torna al torneo' : 'Torna ai tornei'}
      </Link>

      <div className="form-page">
        <h1 className="page-title">{isEdit ? 'Modifica torneo' : 'Crea nuovo torneo'}</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome torneo *</label>
            <input
              className="form-control"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="es. Campionato Estivo 2025"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sport *</label>
            <select
              className="form-control"
              name="sport"
              value={form.sport}
              onChange={handleChange}
              disabled={isEdit}
            >
              {SPORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="form-text">Lo sport non può essere modificato dopo la creazione.</p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">N° massimo squadre *</label>
              <input
                className="form-control"
                type="number"
                name="max_teams"
                value={form.max_teams}
                onChange={handleChange}
                min="2"
                max="64"
                placeholder="es. 8"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data di inizio *</label>
              <input
                className="form-control"
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link
              to={isEdit ? `/tournaments/${id}` : '/tournaments'}
              className="btn btn-secondary"
            >
              Annulla
            </Link>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
