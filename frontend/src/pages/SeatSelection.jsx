import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SeatGrid from '../components/SeatGrid';
import InlineAuth from '../components/InlineAuth';
import { StepBar } from './TravellerList';
import { travellerAPI } from '../services/api';
import useBookingStore from '../stores/bookingStore';
import useSagaStore from '../stores/sagaStore';
import useAuthStore from '../stores/authStore';
import { formatTime, formatCurrency } from '../utils/helpers';

function LockTimer({ expiresAt, onExpire }) {
  const [secsLeft, setSecsLeft] = useState(300);

  useEffect(() => {
    if (!expiresAt) return;
    let called = false;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSecsLeft(diff);
      if (diff === 0 && !called) {
        called = true;
        onExpire?.();
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
    };
  }, [expiresAt, onExpire]);

  const pct = Math.min(100, (secsLeft / 300) * 100);
  const m = Math.floor(secsLeft / 60);
  const s = secsLeft % 60;

  return (
    <div>
      <div className="lock-timer">
        <Clock size={16} />
        <span>Seat reserved for <strong>{m}:{s.toString().padStart(2,'0')}</strong></span>
      </div>
      <div style={{ background: 'var(--border)', height: 3, borderRadius: 2, marginTop: 6 }}>
        <div className="lock-timer-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedTraveller, selectedSeat, setTraveller, setSeat } = useBookingStore();
  const { token, user } = useAuthStore();
  const { sagaState, lockedSeat, lockExpiresAt, lockSeat, requireAuth, authDone, rollback } = useSagaStore();
  const [showAuth, setShowAuth] = useState(false);

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => travellerAPI.getDetail(id).then(r => r.data),
    enabled: !!id,
    refetchInterval: sagaState === 'IDLE' ? 10000 : false,
  });

  useEffect(() => {
    if (ride && !selectedTraveller) setTraveller(ride);
  }, [ride, selectedTraveller, setTraveller]);

  // If saga moved to AUTH_DONE → navigate to payment
  useEffect(() => {
    if (sagaState === 'AUTH_DONE') {
      setShowAuth(false);
      navigate('/payment');
    }
  }, [sagaState, navigate]);

  // Sync auth modal visibility with saga state
  useEffect(() => {
    if (sagaState === 'AUTH_REQUIRED') {
      setShowAuth(true);
    } else if (sagaState === 'IDLE' || sagaState === 'SEAT_LOCKED') {
      // If we are locked but not yet requiring auth, or idle, hide modal
      if (sagaState === 'IDLE') setShowAuth(false);
    }
  }, [sagaState]);

  const handleSeatSelect = useCallback(async (seat) => {
    // Reset any prior lock
    if (lockedSeat?.seat_id && lockedSeat.seat_id !== seat.id) {
      rollback(); // trigger cleanup in background
    }
    setSeat(seat);

    const ok = await lockSeat(seat.id, id);
    if (!ok) {
      toast.error('Seat could not be reserved. Please choose another.');
      queryClient.invalidateQueries(['ride', id]);
      return;
    }

    // If already logged in, skip auth
    if (token && user) {
      console.log('User logged in, skipping auth');
      authDone();
      navigate('/payment');
    } else {
      console.log('User not logged in, requiring auth');
      requireAuth();
    }
  }, [id, lockedSeat, lockSeat, rollback, requireAuth, authDone, token, user, navigate, setSeat, queryClient]);

  const handleCancel = async () => {
    setShowAuth(false);
    await rollback();
    setSeat(null);
    queryClient.invalidateQueries(['ride', id]);
  };

  const handleExpire = async () => {
    toast.error('Seat reservation expired. Please select again.');
    setShowAuth(false);
    await rollback();
    setSeat(null);
    queryClient.invalidateQueries(['ride', id]);
  };

  const currentRide = ride || selectedTraveller;
  const isLocking = sagaState === 'SEAT_LOCKING';

  return (
    <div className="page" style={{ paddingBottom: lockedSeat ? 160 : 40, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
          <button onClick={() => { rollback(); navigate(-1); }} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Choose Your Seat</h2>
            {currentRide && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {currentRide.from_city} → {currentRide.to_city} · {formatTime(currentRide.departure_time)}
              </p>
            )}
          </div>
        </div>
        <StepBar step={2} />
      </div>

      {/* Lock timer (sticky below header) */}
      {lockedSeat && lockExpiresAt && (
        <div style={{ position: 'sticky', top: 116, zIndex: 99, background: '#fff', padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
          <LockTimer expiresAt={lockExpiresAt} onExpire={handleExpire} />
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 480 }} />
        ) : !ride ? (
          <div className="empty-state">
            <div className="empty-icon"><AlertCircle size={36} color="var(--danger)" /></div>
            <p style={{ fontSize: 16, fontWeight: 800 }}>Traveller not found</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '24px 20px', border: 'none', boxShadow: 'var(--shadow-md)' }}>
            {/* Traveller info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>DEPARTURE</p>
                <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)' }}>{formatTime(ride.departure_time)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>FARE</p>
                <p style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)', color: 'var(--primary)' }}>{formatCurrency(ride.price)}</p>
              </div>
            </div>

            {isLocking ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <div className="spin" style={{ width: 40, height: 40, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Reserving your seat...</p>
              </div>
            ) : (
              <SeatGrid seats={ride.seats || []} onSeatSelect={handleSeatSelect} />
            )}
          </div>
        )}
      </div>

      {/* Selected seat CTA */}
      {selectedSeat && sagaState === 'IDLE' && !lockedSeat && (
        <div className="bottom-cta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Selected</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>Seat {selectedSeat.seat_number}</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(currentRide?.price || 0)}</p>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuth && <InlineAuth onSuccess={() => { setShowAuth(false); navigate('/payment'); }} onCancel={handleCancel} />}
    </div>
  );
}
