import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { SPORT_LABEL, SPORT_OPTIONS_WITH_ALL } from '../constants/sports';
import Alert from '../components/Alert';

const SPORTS = SPORT_OPTIONS_WITH_ALL;

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api
        .getFields(query || undefined, sport || undefined)
        .then((data) => {
          setFields(data);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, sport]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Campi Sportivi</h1>
        <p className="page-subtitle">Prenota un campo per il tuo sport preferito</p>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Cerca per nome, sport o indirizzo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="sport-filter">
          {SPORTS.map((s) => (
            <button
              key={s.value}
              className={'filter-btn' + (sport === s.value ? ' active' : '')}
              onClick={() => setSport(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Alert>{error}</Alert>

      {loading ? (
        <div className="loading">Caricamento campi...</div>
      ) : fields.length === 0 ? (
        <div className="empty-state">Nessun campo trovato.</div>
      ) : (
        <div className="card-grid">
          {fields.map((field) => (
            <div key={field.id} className="card field-card">
              <div className="card-header">
                <span className={`badge badge-${field.sport_type}`}>
                  {SPORT_LABEL[field.sport_type]}
                </span>
              </div>
              <h3 className="card-title">{field.name}</h3>
              <p className="card-subtitle">
                {field.address}
              </p>
              <Link to={`/fields/${field.id}`} className="btn btn-primary btn-sm card-action">
                Prenota →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
