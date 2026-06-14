import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Share2, Home, Ticket, MapPin, Clock } from 'lucide-react';
import useBookingStore from '../stores/bookingStore';
import useSagaStore from '../stores/sagaStore';
import { formatDate, formatTime, formatCurrency } from '../utils/helpers';

export default function Confirmation() {
  const navigate = useNavigate();
  const { currentBooking } = useBookingStore();
  const { resetSaga } = useSagaStore();
  const circleRef = useRef(null);

  useEffect(() => {
    resetSaga();
    if (circleRef.current) {
      circleRef.current.style.animation = 'checkPop 0.8s cubic-bezier(0.34,1.56,0.64,1) both';
    }
  }, [resetSaga]);

  if (!currentBooking) { navigate('/home'); return null; }

  const ride = currentBooking.ride;

  return (
    <div className="page" style={{ paddingBottom: 40, background: 'var(--bg)' }}>
      {/* Success Hero */}
      <div style={{ background: 'linear-gradient(135deg, #059669, #10B981)', padding: '56px 24px 80px', textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div ref={circleRef} style={{ display: 'inline-flex', marginBottom: 20, background: 'rgba(255,255,255,0.2)', padding: 20, borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <CheckCircle size={64} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)', marginBottom: 8, letterSpacing: '-0.02em' }}>Booking Confirmed!</h1>
        <p style={{ opacity: 0.9, fontSize: 14, fontWeight: 500 }}>Your seat is locked. Safe travels!</p>
      </div>

      <div style={{ padding: '0 20px', marginTop: -40, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Ticket Card */}
        <div className="card fade-up" style={{ textAlign: 'center', padding: 24, border: 'none', boxShadow: 'var(--shadow-xl)', borderRadius: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Booking Reference</p>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)', fontFamily: 'monospace', marginBottom: 20 }}>
            {currentBooking.booking_ref}
          </div>

          {/* Seat highlight */}
          {currentBooking.seat_numbers?.length > 0 && !currentBooking.seat_numbers.includes('—') && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 14, padding: '14px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Seat</p>
              <p style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit,var(--font-sans)', lineHeight: 1 }}>
                {currentBooking.seat_numbers.join(', ')}
              </p>
            </div>
          )}

          {/* Cab Number highlight if cab booking */}
          {ride?.type === 'cab' && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 14, padding: '14px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cab Number</p>
              <p style={{ fontSize: 30, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit,var(--font-sans)', lineHeight: 1 }}>
                {currentBooking.cab_number || 'Pending Assignment'}
              </p>
            </div>
          )}

          <div style={{ height: 0, borderTop: '2px dashed var(--border)', margin: '0 -24px 20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{formatDate(ride?.departure_time)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Time</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{formatTime(ride?.departure_time)}</p>
            </div>
          </div>
        </div>

        {/* Trip Info */}
        <div className="card fade-up" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-sm)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <MapPin size={16} color="var(--primary)" /> Trip Details
          </h3>
          {[
            { label: 'Route',    value: ride ? `${ride.from_city} → ${ride.to_city}` : '' },
            { label: 'Operator', value: ride?.operator_name },
            ...(ride?.type === 'cab' ? [{ label: 'Cab Number', value: currentBooking.cab_number || 'Pending Assignment', color: currentBooking.cab_number ? 'var(--primary)' : 'var(--danger)' }] : []),
            { label: 'Paid',     value: formatCurrency(currentBooking.total_price), color: 'var(--success)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Boarding Instructions */}
        <div style={{ background: 'var(--warning-bg)', padding: 20, borderRadius: 20, border: '1.5px solid #FDE68A' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#92400E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> Boarding Instructions
          </h3>
          {['Arrive at boarding point 15 mins early', 'Carry a valid government photo ID', 'Show this digital ticket to the driver'].map(ins => (
            <div key={ins} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#92400E', fontWeight: 500 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', marginTop: 6, flexShrink: 0 }} />
              {ins}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button className="btn btn-outline" style={{ height: 50, borderRadius: 14 }} onClick={() => window.print()}>
            <Download size={16} /> Download
          </button>
          <button className="btn btn-outline" style={{ height: 50, borderRadius: 14 }}>
            <Share2 size={16} /> Share
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/home')} style={{ height: 54, fontSize: 15 }}>
          <Home size={18} /> Back to Home
        </button>
        <button onClick={() => navigate('/bookings')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 12 }}>
          <Ticket size={16} /> My Bookings
        </button>
      </div>

      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
