import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SPORT_LABEL = { football: 'Calcio', volleyball: 'Pallavolo', basketball: 'Basket' };

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

function formatTime(t) {
  return t ? t.substring(0, 5) : '';
}

export default function FieldDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [field, setField] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(toISODate(new Date()));
  const [fieldLoading, setFieldLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .getField(id)
      .then(setField)
      .catch((e) => setError(e.message))
      .finally(() => setFieldLoading(false));
  }, [id]);

  const loadSlots = useCallback(() => {
    setSlotsLoading(true);
    api
      .getSlots(id, date)
      .then(setSlots)
      .catch((e) => setError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [id, date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleBook = async (slot) => {
    setBookingSlot(slot.id);
    setError('');
    setSuccess('');
    try {
      await api.bookSlot(id, { slot_id: slot.id, date });
      setSuccess(`Prenotato: ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`);
      loadSlots();
    } catch (e) {
      setError(e.message);
    } finally {
      setBookingSlot(null);
    }
  };

  const handleCancel = async (slot) => {
    setCancellingId(slot.booking_id);
    setError('');
    setSuccess('');
    try {
      await api.cancelBooking(id, slot.booking_id);
      setSuccess('Prenotazione annullata.');
      loadSlots();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (fieldLoading) return <div className="loading">Caricamento...</div>;
  if (!field) return <div className="alert alert-error">Campo non trovato.</div>;

  const today = toISODate(new Date());

  return (
    <div className="page">
      <Link to="/fields" className="back-link">
        ← Torna ai campi
      </Link>

      <div className="field-header card">
        <div className="field-header-top">
          <div>
            <h1 className="page-title">{field.name}</h1>
            <p className="field-address">
              <span className="icon">📍</span> {field.address}
            </p>
          </div>
          <span className={`badge badge-lg badge-${field.sport_type}`}>
            {SPORT_LABEL[field.sport_type]}
          </span>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Disponibilità fasce orarie</h2>
        <div className="date-picker-row">
          <label className="form-label">Seleziona data:</label>
          <input
            className="form-control date-input"
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {slotsLoading ? (
          <div className="loading">Caricamento fasce...</div>
        ) : (
          <div className="slots-grid">
            {slots.map((slot) => {
              const isOwn = user && slot.booked_by === user.id;
              const isOther = !slot.available && !isOwn;
              return (
                <div
                  key={slot.id}
                  className={`slot ${slot.available ? 'slot-free' : isOwn ? 'slot-own' : 'slot-booked'}`}
                >
                  <div className="slot-time">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </div>
                  <div className="slot-status">
                    {slot.available ? 'Libero' : isOwn ? 'Prenotato da te' : 'Occupato'}
                  </div>
                  {slot.available && user && (
                    <button
                      className="btn btn-success btn-xs"
                      onClick={() => handleBook(slot)}
                      disabled={bookingSlot === slot.id}
                    >
                      {bookingSlot === slot.id ? '...' : 'Prenota'}
                    </button>
                  )}
                  {isOwn && (
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => handleCancel(slot)}
                      disabled={cancellingId === slot.booking_id}
                    >
                      {cancellingId === slot.booking_id ? '...' : 'Annulla'}
                    </button>
                  )}
                  {isOther && <span className="slot-occupied-label">—</span>}
                  {slot.available && !user && (
                    <Link to="/login" className="btn btn-outline btn-xs">
                      Accedi
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
