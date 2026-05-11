import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Compila tutti i campi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/fields');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Accedi</h1>
        <p className="auth-subtitle">Bentornato su SportBooking</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Il tuo username"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="La tua password"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="auth-footer">
          Non hai un account?{' '}
          <Link to="/signup" className="link">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
