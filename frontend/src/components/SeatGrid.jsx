import useBookingStore from '../stores/bookingStore';
import useSagaStore from '../stores/sagaStore';

export default function SeatGrid({ seats, onSeatSelect }) {
  const { selectedSeat } = useBookingStore();
  const { lockedSeat } = useSagaStore();

  // Build seat map: { number -> seat }
  const seatMap = {};
  seats.forEach(s => { seatMap[parseInt(s.seat_number)] = s; });

  const getSeatStatus = (seat) => {
    if (!seat) return 'empty';
    if (selectedSeat?.id === seat.id) return 'selected';
    if (lockedSeat?.seat_id === seat.id) return 'selected'; // already in saga
    if (seat.status === 'booked' || seat.status === 'blocked') return 'booked';
    if (seat.status === 'locked') return 'locked';
    return 'available';
  };

  // Van layout: rows of [left, right] seats, with driver row at top
  // 17 seats: row1=2, row2=2, row3=2, row4=2, row5=2, row6=2, row7=2, row8=1(driver side) = 15+2 = 17
  // Actual layout: front row = seat 1 (co-driver), rows 2-17 = 2 per row = 16 → but we have 17
  // Layout: 1 front + 4 rows of 3 + 1 row of 2 = 1+12+2 = 15. Let's do:
  // Row 0 (front): [1] only (front passenger / co-driver side) — driver on right
  // Rows 1-8: [L, R] = seats 2-17 (16 seats, 8 rows of 2)
  // Total: 1 + 16 = 17 ✓

  const rows = [];
  // Front row — seat 1
  rows.push({ type: 'front', seats: [seatMap[1]] });
  // Regular rows — seats 2-17
  for (let r = 0; r < 8; r++) {
    const l = seatMap[2 + r * 2];
    const right = seatMap[3 + r * 2];
    rows.push({ type: 'regular', seats: [l, right] });
  }

  const SeatBtn = ({ seat }) => {
    const status = getSeatStatus(seat);
    if (!seat) return <div style={{ height: 50 }} />;
    return (
      <button
        className={`seat-btn ${status}`}
        disabled={status === 'booked' || status === 'locked'}
        onClick={() => status === 'available' && onSeatSelect && onSeatSelect(seat)}
        title={status === 'locked' ? 'Temporarily reserved' : status === 'booked' ? 'Already booked' : `Seat ${seat.seat_number}`}
      >
        {status === 'selected' ? '✓' : seat.seat_number}
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
              {row.type === 'front' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 10 }}>
                  <SeatBtn seat={row.seats[0]} />
                  <div className="seat-aisle" />
                  <div style={{ height: 50 }} /> {/* driver placeholder */}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 10 }}>
                  <SeatBtn seat={row.seats[0]} />
                  <div className="seat-aisle">|</div>
                  <SeatBtn seat={row.seats[1]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
