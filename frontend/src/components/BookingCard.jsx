import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Zap, ArrowRight, Calendar } from 'lucide-react';
import { formatDate, formatTime, formatCurrency, vehicleLabel } from '../utils/helpers';

const STATUS_LABEL = {
  confirmed:  'Confirmed',
  pending:    'Pending',
  cancelled:  'Cancelled',
  completed:  'Completed',
};

export function getBookingStatus(booking) {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.status === 'confirmed' && booking.ride) {
    const dep = new Date(booking.ride.departure_time);
    return dep < new Date() ? 'completed' : 'confirmed';
  }
  return booking.status;
}

export default function BookingCard({ booking }) {
  const navigate = useNavigate();
  const status = getBookingStatus(booking);
  const ride = booking.ride;

  if (!ride) return null;

  return (
    <div
      className="card fade-up"
      style={{ 
        marginBottom: 16, 
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        background: '#fff'
      }}
      onClick={() => navigate(`/bookings/${booking.id}`)}
    >
      <div style={{ display: 'flex' }}>
        {/* Left Color Bar */}
        <div style={{ 
          width: 6, 
          background: status === 'confirmed' ? 'var(--success)' : 
                      status === 'cancelled' ? 'var(--danger)' : 
                      status === 'completed' ? 'var(--text-muted)' : 'var(--warning)' 
        }} />
        
        <div style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="var(--primary)" fill="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>RID-{booking.booking_ref}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{vehicleLabel(ride.type)}</p>
              </div>
            </div>
            <span className={`badge badge-${status}`} style={{ fontSize: 10, padding: '4px 8px' }}>
              {STATUS_LABEL[status] || status}
            </span>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
             <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 16, fontWeight: 800 }}>{ride.from_city}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{formatTime(ride.departure_time)}</p>
             </div>
             <ArrowRight size={16} color="var(--border)" strokeWidth={3} />
             <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 16, fontWeight: 800 }}>{ride.to_city}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{formatTime(ride.arrival_time)}</p>
             </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--bg)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Calendar size={14} />
                  {formatDate(ride.departure_time)}
               </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(booking.total_price)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
