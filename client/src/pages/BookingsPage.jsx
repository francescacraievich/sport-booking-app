import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

function formatTime(t) {
  return t ? t.substring(0, 5) : '';
}

function bookingDateStr(d) {
  return new Date(d).toISOString().split('T')[0];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .getMyBookings()
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (booking) => {
    if (!window.confirm('Annullare questa prenotazione?')) return;
    setCancelling(booking.id);
    setError('');
    setSuccess('');
    try {
      await api.cancelBooking(booking.field_id, booking.id);
      setSuccess('Prenotazione annullata.');
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(null);
    }
  };

  const todayStr = today();
  const upcoming = bookings.filter((b) => bookingDateStr(b.date) >= todayStr);
  const past = bookings.filter((b) => bookingDateStr(b.date) < todayStr);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Le mie prenotazioni</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">Caricamento prenotazioni...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          Nessuna prenotazione.{' '}
          <Link to="/fields" className="link">
            Prenota un campo!
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="booking-section">
              <h2 className="section-title">Prossime prenotazioni</h2>
              <div className="bookings-list">
                {upcoming.map((b) => (
                  <div key={b.id} className="card booking-card booking-upcoming">
                    <div className="booking-sport">
                      <span className={`badge badge-${b.sport_type}`}>
                        {SPORT_LABEL[b.sport_type]}
                      </span>
                    </div>
                    <div className="booking-info">
                      <h3 className="booking-field">
                        <Link to={`/fields/${b.field_id}`} className="link">
                          {b.field_name}
                        </Link>
                      </h3>
                      <p className="booking-details">
                        📅 {formatDate(b.date)} &nbsp;|&nbsp; 🕐 {formatTime(b.start_time)} –{' '}
                        {formatTime(b.end_time)}
                      </p>
                      <p className="booking-address">📍 {b.address}</p>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(b)}
                      disabled={cancelling === b.id}
                    >
                      {cancelling === b.id ? '...' : 'Annulla'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="booking-section">
              <h2 className="section-title muted">Prenotazioni passate</h2>
              <div className="bookings-list">
                {past.map((b) => (
                  <div key={b.id} className="card booking-card booking-past">
                    <div className="booking-sport">
                      <span className={`badge badge-${b.sport_type}`}>
                        {SPORT_LABEL[b.sport_type]}
                      </span>
                    </div>
                    <div className="booking-info">
                      <h3 className="booking-field">{b.field_name}</h3>
                      <p className="booking-details">
                        📅 {formatDate(b.date)} &nbsp;|&nbsp; 🕐 {formatTime(b.start_time)} –{' '}
                        {formatTime(b.end_time)}
                      </p>
                    </div>
                    <span className="badge badge-played">Passata</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
