import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Truck, AlertCircle, ArrowRight, Star, Users, Car, MapPin, Pencil, SlidersHorizontal } from 'lucide-react';
import { travellerAPI, cabAPI } from '../services/api';
import useBookingStore from '../stores/bookingStore';
import { formatTime, formatDuration, formatCurrency } from '../utils/helpers';
import RideTypeToggle from '../components/RideTypeToggle';

function StepBar({ step }) {
  const steps = ['Route', 'Auth', 'Seat', 'Pay', 'Done'];
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

// ── Cab Card (Horizontal Layout) ─────────────────────────────────────────────
function CabCard({ cab, onSelect }) {
  return (
    <div className="cab-card-h" onClick={() => onSelect(cab)}>
      {/* Left: Image */}
      <div className="cab-card-h-img-wrap">
        <img
          src={cab.image_url}
          alt={cab.name}
          className="cab-card-h-img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Right: Details */}
      <div className="cab-card-h-body">
        {/* Name + fare */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{cab.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{cab.rating}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({cab.total_reviews})</span>
            </div>
            {/* Cab Number Badge — license plate style */}
            {cab.cab_number && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 7,
                background: '#FEF9C3',
                border: '1.5px solid #EAB308',
                borderRadius: 6,
                padding: '3px 9px',
              }}>
                <Car size={11} color="#92400E" />
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#92400E',
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                }}>{cab.cab_number}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit, var(--font-sans)' }}>
            {formatCurrency(cab.fare)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={13} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{cab.rating}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} color="var(--success)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{cab.eta_minutes} min away</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            className="btn-select-cab"
            onClick={(e) => { e.stopPropagation(); onSelect(cab); }}
          >
            Select Cab
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TravellerList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedRoute, travelDate, setTraveller, setCab } = useBookingStore();
  const [mode, setMode] = useState('shuttle');

  useEffect(() => {
    if (selectedRoute) {
      queryClient.invalidateQueries({ queryKey: ['cabs'] });
    }
  }, [selectedRoute, queryClient]);

  const { data: shuttleData, isLoading: shuttleLoading, isError: shuttleError, refetch: refetchShuttle } = useQuery({
    queryKey: ['travellers', selectedRoute?.from, selectedRoute?.to, travelDate],
    queryFn: () => travellerAPI.search({ from: selectedRoute.from, to: selectedRoute.to, date: travelDate }).then(r => r.data),
    enabled: !!selectedRoute && mode === 'shuttle',
    staleTime: 30000,
  });

  const { data: cabData, isLoading: cabLoading, isError: cabError, refetch: refetchCab } = useQuery({
    queryKey: ['cabs', selectedRoute?.from, selectedRoute?.to, travelDate],
    queryFn: () => cabAPI.search({ from: selectedRoute.from, to: selectedRoute.to, date: travelDate }).then(r => r.data),
    enabled: !!selectedRoute && mode === 'cab',
    staleTime: 30000,
  });

  if (!selectedRoute) { navigate('/home'); return null; }

  const travellers = shuttleData || [];
  const cabs = cabData || [];

  const handleSelectShuttle = (t) => {
    if (t.available_seats === 0) return;
    setTraveller(t);
    navigate(`/seats/${t.id}`);
  };

  const handleSelectCab = (cab) => {
    setCab(cab);
    navigate('/payment');
  };

  const getSeatsColor = (avail, total) => {
    const pct = avail / total;
    if (pct === 0) return 'full';
    if (pct <= 0.3) return 'low';
    return 'available';
  };

  const isLoading = mode === 'shuttle' ? shuttleLoading : cabLoading;
  const isError   = mode === 'shuttle' ? shuttleError   : cabError;
  const refetch   = mode === 'shuttle' ? refetchShuttle : refetchCab;

  const formattedDate = travelDate
    ? new Date(travelDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'All dates';

  return (
    <div className="page" style={{ paddingBottom: 20, background: 'var(--bg)' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
          <button onClick={() => navigate('/home')} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Select {mode === 'shuttle' ? 'Shuttle' : 'Cab'}</h2>
          </div>
        </div>
        <StepBar step={1} />
      </div>

      <div style={{ padding: '16px 16px 32px' }}>
        {/* Route Info Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 16,
          border: '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedRoute.from} → {selectedRoute.to}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{formattedDate}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/home')}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* Shuttle/Cab Toggle */}
        <div style={{ marginBottom: 16 }}>
          <RideTypeToggle mode={mode} onModeChange={setMode} />
        </div>

        {/* Count + Filters Row */}
        {!isLoading && !isError && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingLeft: 4, paddingRight: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {mode === 'shuttle' ? travellers.length : cabs.length} {mode === 'shuttle' ? 'shuttles' : 'cabs'} available
            </p>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 99,
              border: '1.5px solid var(--border)', background: '#fff',
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: mode === 'cab' ? 140 : 120, marginBottom: 12, borderRadius: 16 }} />)
        ) : isError ? (
          <div className="empty-state">
            <div className="empty-icon"><AlertCircle size={36} color="var(--danger)" /></div>
            <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Something went wrong</p>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={refetch}>Retry</button>
          </div>
        ) : mode === 'shuttle' ? (
          travellers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Truck size={36} color="var(--primary)" /></div>
              <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No shuttles available</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>No trips found for this route on the selected date.</p>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/home')}>Change Date</button>
            </div>
          ) : (
            <>
              {travellers.map(t => {
                const isFull = t.available_seats === 0;
                const seatsColor = getSeatsColor(t.available_seats, t.total_seats);
                return (
                  <div key={t.id} className={`traveller-card ${isFull ? 'full' : ''}`} onClick={() => handleSelectShuttle(t)}>
                    {t.image_url && <img src={t.image_url} alt={t.operator_name} className="traveller-img" />}
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
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Price Starting From</p>
                        </div>
                      )}
                    </div>

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="seats-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`seats-dot ${seatsColor}`} style={{ width: 10, height: 10, borderRadius: '50%' }} />
                        <span style={{
                          fontSize: 14, fontWeight: 800,
                          color: isFull ? 'var(--danger)' : 'var(--success)',
                          background: isFull ? 'var(--danger-light)' : 'var(--success-light)',
                          padding: '4px 10px', borderRadius: 6
                        }}>
                          {isFull ? 'No seats left' : `${t.available_seats} Available Seats`}
                        </span>
                      </div>
                      {!isFull && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                          Select Seat <ArrowRight size={14} />
                        </div>
                      )}
                    </div>

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
          )
        ) : (
          // ── Cab mode ──
          cabs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Car size={36} color="var(--primary)" /></div>
              <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No cabs available</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>No cabs found for this route right now.</p>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={refetch}>Refresh</button>
            </div>
          ) : (
            <>
              {cabs.map(cab => <CabCard key={cab.id} cab={cab} onSelect={handleSelectCab} />)}
            </>
          )
        )}
      </div>
    </div>
  );
}
