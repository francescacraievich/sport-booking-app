import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', name: '', surname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, name, surname } = form;
    if (!username || !password || !name || !surname) {
      setError('Compila tutti i campi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(form);
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
        <h1 className="auth-title">Registrazione</h1>
        <p className="auth-subtitle">Crea il tuo account SportBooking</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                className="form-control"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Mario"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cognome</label>
              <input
                className="form-control"
                type="text"
                name="surname"
                value={form.surname}
                onChange={handleChange}
                placeholder="Rossi"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="mario.rossi"
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
              placeholder="Almeno 6 caratteri"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Registrazione...' : 'Crea account'}
          </button>
        </form>

        <p className="auth-footer">
          Hai già un account?{' '}
          <Link to="/login" className="link">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
