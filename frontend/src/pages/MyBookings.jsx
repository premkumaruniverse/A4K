import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Clock, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { bookingsAPI } from '../services/api';
import { formatDate, formatTime, formatCurrency } from '../utils/helpers';

function statusBadge(status) {
  const map = { confirmed: 'badge-confirmed', pending: 'badge-pending', cancelled: 'badge-cancelled', completed: 'badge-completed' };
  return `badge ${map[status] || 'badge-pending'}`;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsAPI.getMyBookings().then(r => r.data),
  });
  const bookings = data || [];

  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '44px 24px 32px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)' }}>My Bookings</h1>
        </div>
        <p style={{ fontSize: 13, opacity: 0.75, fontWeight: 500 }}>{bookings.length} trip{bookings.length !== 1 ? 's' : ''} booked</p>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12 }} />)
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Ticket size={36} color="var(--primary)" /></div>
            <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No bookings yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Book your first KGP shuttle trip!</p>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/home')}>Book Now</button>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="booking-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${b.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800 }}>{b.ride?.from_city} → {b.ride?.to_city}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{b.booking_ref}</p>
                  </div>
                </div>
                <span className={statusBadge(b.status)}>{b.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                    <Clock size={12} /><span style={{ fontSize: 12, fontWeight: 600 }}>{b.ride ? formatTime(b.ride.departure_time) : '—'}</span>
                  </div>
                  {b.seat_numbers?.length > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 6 }}>
                      Seat {b.seat_numbers.join(', ')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(b.total_price)}</span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
