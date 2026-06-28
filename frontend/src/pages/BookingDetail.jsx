import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Ticket, AlertCircle, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../services/api';
import { formatDate, formatTime, formatCurrency } from '../utils/helpers';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsAPI.getBooking(id).then(r => r.data),
  });

  const cancelMut = useMutation({
    mutationFn: () => bookingsAPI.cancel(id),
    onSuccess: () => { qc.invalidateQueries(['booking', id]); qc.invalidateQueries(['my-bookings']); toast.success('Booking cancelled'); },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Cannot cancel'),
  });

  if (isLoading) return <div className="page"><div style={{ padding: 24 }}><div className="skeleton" style={{ height: 400 }} /></div></div>;
  if (!booking) return (
    <div className="page">
      <div className="empty-state"><div className="empty-icon"><AlertCircle size={36} color="var(--danger)" /></div><p style={{ fontWeight: 800 }}>Booking not found</p></div>
    </div>
  );

  const ride = booking.ride;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="page" style={{ paddingBottom: canCancel ? 120 : 40, background: 'var(--bg)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '44px 24px 32px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 900 }}>Booking Details</h1>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}>BOOKING REF</p>
          <p style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4 }}>{booking.booking_ref}</p>
          {booking.seat_numbers?.length > 0 && booking.seat_numbers[0] !== '—' && (
            <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 700, marginTop: 6 }}>Seat {booking.seat_numbers.join(', ')}</p>
          )}
          {/* Cab number for cab-type bookings */}
          {(booking.cab_number || booking.cab?.cab_number) && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 10,
              background: '#FEF9C3',
              border: '1.5px solid #EAB308',
              borderRadius: 6,
              padding: '4px 10px',
            }}>
              <Car size={12} color="#92400E" />
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#92400E',
                fontFamily: 'monospace',
                letterSpacing: '0.07em',
              }}>{booking.cab_number || booking.cab?.cab_number}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status */}
        <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>Status</h3>
            <span className={`badge badge-${booking.status}`}>{booking.status}</span>
          </div>
          {[
            { label: 'Payment', value: booking.payment_status, badge: true },
            { label: 'Amount Paid', value: formatCurrency(booking.total_price), color: 'var(--success)' },
          ].map(({ label, value, color, badge }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--bg)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              {badge ? <span className={`badge badge-${value}`}>{value}</span> : <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>}
            </div>
          ))}
        </div>

        {/* Trip Info */}
        {ride && (
          <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="var(--primary)" /> Trip Info
            </h3>
            {[
              { label: 'Route',      value: `${ride.from_city} → ${ride.to_city}` },
              { label: 'Date',       value: formatDate(ride.departure_time) },
              { label: 'Departure',  value: formatTime(ride.departure_time) },
              { label: 'Arrival',    value: formatTime(ride.arrival_time) },
              { label: 'Operator',   value: ride.operator_name },
              ...(booking.cab_number ? [{ label: 'Cab No.', value: booking.cab_number, highlight: true }] : []),
              ...(booking.cab?.cab_number && !booking.cab_number ? [{ label: 'Cab No.', value: booking.cab.cab_number, highlight: true }] : []),
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--bg)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                {highlight ? (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#92400E',
                    background: '#FEF9C3',
                    border: '1.5px solid #EAB308',
                    borderRadius: 5,
                    padding: '2px 8px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.06em',
                  }}>{value}</span>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canCancel && (
        <div className="bottom-cta">
          <button className="btn btn-danger" style={{ height: 54 }} onClick={() => { if (window.confirm('Cancel this booking?')) cancelMut.mutate(); }} disabled={cancelMut.isPending}>
            {cancelMut.isPending ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}
    </div>
  );
}
