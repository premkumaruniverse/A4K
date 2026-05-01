import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Truck, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { travellerAPI } from '../services/api';
import useBookingStore from '../stores/bookingStore';
import { formatTime, formatDuration, formatCurrency } from '../utils/helpers';

function StepBar({ step }) {
  const steps = ['Route', 'Seat', 'Auth', 'Pay', 'Done'];
  return (
    <div className="step-bar">
      {steps.map((s, i) => {
        const status = i < step ? 'done' : i === step ? 'active' : '';
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
            <div className={`step-item ${status}`} style={{ minWidth: 0 }}>
              <div className="step-circle">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

export { StepBar };

export default function TravellerList() {
  const navigate = useNavigate();
  const { selectedRoute, travelDate, setTraveller } = useBookingStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['travellers', selectedRoute?.from, selectedRoute?.to, travelDate],
    queryFn: () => travellerAPI.search({ from: selectedRoute.from, to: selectedRoute.to, date: travelDate }).then(r => r.data),
    enabled: !!selectedRoute,
    staleTime: 30000,
  });

  if (!selectedRoute) { navigate('/home'); return null; }

  const travellers = data || [];

  const handleSelect = (t) => {
    if (t.available_seats === 0) return;
    setTraveller(t);
    navigate(`/seats/${t.id}`);
  };

  const getSeatsColor = (avail, total) => {
    const pct = avail / total;
    if (pct === 0) return 'full';
    if (pct <= 0.3) return 'low';
    return 'available';
  };

  return (
    <div className="page" style={{ paddingBottom: 20, background: 'var(--bg)' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
          <button onClick={() => navigate('/home')} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>{selectedRoute.from} → {selectedRoute.to}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{travelDate ? new Date(travelDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'All dates'}</p>
          </div>
        </div>
        <StepBar step={1} />
      </div>

      <div style={{ padding: '16px 16px 32px' }}>
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 12 }} />)
        ) : isError ? (
          <div className="empty-state">
            <div className="empty-icon"><AlertCircle size={36} color="var(--danger)" /></div>
            <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Something went wrong</p>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={refetch}>Retry</button>
          </div>
        ) : travellers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Truck size={36} color="var(--primary)" /></div>
            <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No travellers available</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>No trips found for this route on the selected date.</p>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/home')}>Change Date</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 4 }}>
              {travellers.length} trips available
            </p>
            {travellers.map(t => {
              const isFull = t.available_seats === 0;
              const seatsColor = getSeatsColor(t.available_seats, t.total_seats);
              return (
                <div key={t.id} className={`traveller-card ${isFull ? 'full' : ''}`} onClick={() => handleSelect(t)}>
                  {/* Operator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={16} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{t.operator_name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>17-Seater Traveller</p>
                      </div>
                    </div>
                    {isFull ? (
                      <span className="badge badge-danger">Fully Booked</span>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit, var(--font-sans)' }}>{formatCurrency(t.price)}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>per seat</p>
                      </div>
                    )}
                  </div>

                  {/* Times */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <p className="time-display">{formatTime(t.departure_time)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Departure</p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span className="duration-badge">{formatDuration(t.departure_time, t.arrival_time)}</span>
                      <div style={{ width: '80%', height: 1, borderTop: '2px dashed var(--border)' }} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p className="time-display">{formatTime(t.arrival_time)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Arrival</p>
                    </div>
                  </div>

                  {/* Seats + CTA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="seats-indicator">
                      <div className={`seats-dot ${seatsColor}`} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {isFull ? 'No seats left' : `${t.available_seats} seat${t.available_seats !== 1 ? 's' : ''} available`}
                      </span>
                    </div>
                    {!isFull && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                        Select Seat <ArrowRight size={14} />
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {t.amenities?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      {t.amenities.map(a => (
                        <span key={a} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
