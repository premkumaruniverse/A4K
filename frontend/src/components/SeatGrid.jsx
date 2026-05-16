import useBookingStore from '../stores/bookingStore';
import useSagaStore from '../stores/sagaStore';

export default function SeatGrid({ seats, price, onSeatSelect }) {
  const { selectedSeat } = useBookingStore();
  const { lockedSeat } = useSagaStore();

  const getSeatStatus = (seat) => {
    if (!seat) return 'empty';
    if (selectedSeat?.id === seat.id) return 'selected';
    if (lockedSeat?.seat_id === seat.id) return 'selected'; 
    if (seat.status === 'booked' || seat.status === 'blocked') return 'booked';
    if (seat.status === 'locked') return 'locked';
    return 'available';
  };

  const rows = [];
  const numRows = Math.ceil(seats.length / 3);
  for (let r = 0; r < numRows; r++) {
    const s1 = seats[r * 3] || null;
    const s2 = seats[r * 3 + 1] || null;
    const s3 = seats[r * 3 + 2] || null;
    rows.push({ type: 'regular', seats: [s1, s2, s3] });
  }

  const SeatBtn = ({ seat }) => {
    const status = getSeatStatus(seat);
    if (!seat) return <div style={{ height: 50 }} />;
    
    const handleClick = () => {
      console.log('Seat clicked:', seat.seat_number, 'Status:', status);
      if (status === 'available' && onSeatSelect) {
        onSeatSelect(seat);
      }
    };

    return (
      <button
        className={`seat-btn ${status}`}
        disabled={status === 'booked' || status === 'locked'}
        onClick={handleClick}
        title={status === 'locked' ? 'Temporarily reserved' : status === 'booked' ? 'Already booked' : `Seat ${seat.seat_number}`}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 56, padding: '4px' }}
      >
        <span style={{ fontSize: 16, fontWeight: 700 }}>{status === 'selected' ? '✓' : seat.seat_number}</span>
        {(seat.price || price) && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.9, marginTop: 2 }}>₹{seat.price || price}</span>}
      </button>
    );
  };

  return (
    <div>
      {/* Legend */}
      <div className="seat-legend" style={{ marginBottom: 24 }}>
        {[
          { label: 'Available', cls: 'available' },
          { label: 'Selected',  cls: 'selected' },
          { label: 'Booked',    cls: 'booked' },
          { label: 'Reserved',  cls: 'locked' },
        ].map(({ label, cls }) => (
          <div key={label} className="legend-item">
            <div className={`legend-dot ${cls}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Van outline */}
      <div style={{ background: 'var(--bg)', borderRadius: 20, padding: '20px 24px', border: '2px solid var(--border)' }}>
        {/* Driver */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 10, background: '#F3F4F6', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🚐
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

        <div className="van-layout">
          {rows.map((row, ri) => (
            <div key={ri}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px 1fr', gap: 10, marginBottom: 12 }}>
                <SeatBtn seat={row.seats[0]} />
                <SeatBtn seat={row.seats[1]} />
                <div className="seat-aisle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border)' }}>|</div>
                <SeatBtn seat={row.seats[2]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
