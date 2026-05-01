import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ArrowLeft, ChevronRight, User, Hash, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useBookingStore from '../stores/bookingStore';

const GENDERS = ['Male', 'Female', 'Other'];

function PassengerForm({ index, data, onChange }) {
  return (
    <div className="card fade-up" style={{ marginBottom: 20, padding: 24, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Passenger {index + 1}</h3>
        </div>
        {data.seat && (
          <div style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Seat {data.seat}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="input-label">Full Name</label>
        <div style={{ position: 'relative' }}>
          <UserCircle size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="e.g. John Doe"
            value={data.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            style={{ paddingLeft: 44, height: 52 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <label className="input-label">Age</label>
          <div style={{ position: 'relative' }}>
             <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
             <input
              className="input-field"
              type="number"
              placeholder="25"
              value={data.age}
              onChange={(e) => onChange(index, 'age', e.target.value)}
              style={{ paddingLeft: 40, height: 52 }}
            />
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <label className="input-label">Gender</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {GENDERS.map((g) => (
              <button
                key={g}
                className={`gender-btn ${data.gender === g.toLowerCase() ? 'active' : ''}`}
                onClick={() => onChange(index, 'gender', g.toLowerCase())}
              >
                {g.charAt(0)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassengerDetails() {
  const navigate = useNavigate();
  const { selectedRide, selectedSeats, numPassengers, setNumPassengers, setPassengers } = useBookingStore();

  const isBus = selectedRide?.type === 'bus';
  
  const [forms, setForms] = useState(() =>
    Array.from({ length: isBus ? selectedSeats.length : numPassengers }, (_, i) => ({
      name: '', age: '', gender: '',
      seat: isBus ? selectedSeats[i]?.seat_number : undefined,
    }))
  );

  if (!selectedRide) { navigate('/home'); return null; }

  const updateCount = (delta) => {
    const max = selectedRide.type === 'auto' ? 3 : 4;
    const newCount = Math.max(1, Math.min(max, numPassengers + delta));
    setNumPassengers(newCount);
    setForms((prev) => {
      const next = [...prev];
      while (next.length < newCount) next.push({ name: '', age: '', gender: '' });
      while (next.length > newCount) next.pop();
      return next;
    });
  };

  const handleChange = (idx, field, value) => {
    setForms((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleContinue = () => {
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.name.trim()) { toast.error(`Please enter name for Passenger ${i + 1}`); return; }
      if (!f.age || Number(f.age) < 1) { toast.error(`Please enter valid age for Passenger ${i + 1}`); return; }
      if (!f.gender) { toast.error(`Please select gender for Passenger ${i + 1}`); return; }
    }
    setPassengers(forms.map((f) => ({ name: f.name.trim(), age: Number(f.age), gender: f.gender })));
    navigate('/payment');
  };

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--bg)', border: 'none', padding: 10, borderRadius: 12, cursor: 'pointer' }}>
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Travelers</h2>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Provide traveler information</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="stepper" style={{ background: '#fff', paddingTop: 0 }}>
          <div className={`step ${isBus ? 'done' : 'active'}`}>
            <div className="step-circle">{isBus ? '✓' : '1'}</div>
            <span className="step-label">{isBus ? 'Seats' : 'Travelers'}</span>
          </div>
          <div className={`step-line ${isBus ? 'done' : ''}`} />
          <div className={`step ${isBus ? 'active' : ''}`}>
            <div className="step-circle">{isBus ? '2' : '2'}</div>
            <span className="step-label">{isBus ? 'Travelers' : 'Payment'}</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle">{isBus ? '3' : '3'}</div>
            <span className="step-label">{isBus ? 'Payment' : 'Confirm'}</span>
          </div>
        </div>
      </div>

      <div className="section">
        {/* Passenger count selector (non-bus) */}
        {!isBus && (
          <div className="card fade-up" style={{ marginBottom: 24, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>How many travelers?</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Max {selectedRide.type === 'auto' ? 3 : 4} for this ride
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg)', padding: '6px', borderRadius: 40 }}>
                <button
                  onClick={() => updateCount(-1)}
                  disabled={numPassengers <= 1}
                  className="btn-icon"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid var(--border)', opacity: numPassengers <= 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
                >
                  <Minus size={18} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{numPassengers}</span>
                <button
                  onClick={() => updateCount(1)}
                  disabled={numPassengers >= (selectedRide.type === 'auto' ? 3 : 4)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(37,99,235,0.3)' }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {forms.map((f, i) => (
          <PassengerForm key={i} index={i} data={f} onChange={handleChange} />
        ))}

        {/* Tip Card */}
        <div style={{ 
          background: 'var(--warning-bg)', padding: 16, borderRadius: 16, 
          display: 'flex', gap: 12, border: '1px solid #FEF3C7', marginTop: 8 
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Hash size={14} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--warning-text)', fontWeight: 500, lineHeight: 1.5 }}>
            Insurance cover of <strong style={{ fontWeight: 800 }}>₹5,00,000</strong> is included for all travelers at no extra cost.
          </p>
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={handleContinue} style={{ height: 56, fontSize: 16 }}>
          <span>Proceed to Payment</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
