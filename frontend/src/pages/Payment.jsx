import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, CreditCard, CheckCircle2, Lock, ArrowLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { StepBar } from './TravellerList';
import useBookingStore from '../stores/bookingStore';
import useSagaStore from '../stores/sagaStore';
import useAuthStore from '../stores/authStore';
import { formatTime, formatCurrency } from '../utils/helpers';

const METHODS = [
  { key: 'upi',  label: 'UPI Payment',        sub: 'Google Pay, PhonePe, Paytm', Icon: Smartphone, color: '#00BAF2' },
  { key: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay',   Icon: CreditCard,  color: '#2563EB' },
];

export default function Payment() {
  const navigate = useNavigate();
  const { selectedTraveller, selectedSeat, setCurrentBooking, reset } = useBookingStore();
  const { sagaState, lockedSeat, lockExpiresAt, paymentMethod, setPaymentMethod, initPayment, verifyPayment, rollback, error } = useSagaStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [secsLeft, setSecsLeft] = useState(300);

  useEffect(() => {
    if (!lockedSeat || sagaState === 'CONFIRMED') return;
    if (!lockExpiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt) - Date.now()) / 1000));
      setSecsLeft(diff);
      if (diff === 0) { toast.error('Seat reservation expired!'); navigate(-1); }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockExpiresAt, sagaState, navigate, lockedSeat]);

  // Redirect if prerequisites not met
  if (!lockedSeat || !selectedTraveller) { navigate('/home'); return null; }
  if (sagaState === 'IDLE' && !lockedSeat) { navigate('/home'); return null; }

  const ride = selectedTraveller;
  const seat = lockedSeat;
  const baseFare = ride.price;
  const taxes = Math.round(baseFare * 0.05 * 100) / 100;
  const total = Math.round((baseFare + taxes) * 100) / 100;

  const handlePay = async () => {
    setLoading(true);
    try {
      const booking = await initPayment(ride.id, user?.name || user?.phone || 'Traveller');
      if (!booking) { setLoading(false); return; }

      const confirmed = await verifyPayment();
      if (!confirmed) { setLoading(false); return; }

      setCurrentBooking(confirmed);
      reset();
      navigate('/confirmation');
    } catch {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const m = Math.floor(secsLeft / 60);
  const s = secsLeft % 60;

  return (
    <div className="page" style={{ paddingBottom: 160, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Review & Pay</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--success-bg)', padding: '6px 10px', borderRadius: 10 }}>
            <Lock size={12} color="var(--success)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>Secure</span>
          </div>
        </div>
        <StepBar step={3} />
      </div>

      {/* Seat timer */}
      <div style={{ margin: '16px 20px 0' }}>
        <div className="lock-timer">
          <Clock size={14} />
          <span>Seat held for <strong>{m}:{s.toString().padStart(2,'0')}</strong></span>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Booking Summary */}
        <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Summary</h3>

          {[
            { label: 'Route',      value: `${ride.from_city} → ${ride.to_city}` },
            { label: 'Departure',  value: formatTime(ride.departure_time) },
            { label: 'Arrival',    value: formatTime(ride.arrival_time) },
            { label: 'Seat',       value: `Seat #${seat.seat_number}`, bold: true },
            { label: 'Operator',   value: ride.operator_name },
          ].map(({ label, value, bold }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: bold ? 800 : 700, color: bold ? 'var(--primary)' : 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px dashed var(--border)' }}>
            {[
              { label: 'Base Fare',       value: formatCurrency(baseFare) },
              { label: 'GST (5%)',         value: formatCurrency(taxes) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit,var(--font-sans)' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {METHODS.map(({ key, label, sub, Icon, color }) => (
            <div key={key} className={`payment-card ${paymentMethod === key ? 'selected' : ''}`} onClick={() => setPaymentMethod(key)}>
              <div className="payment-radio"><div className="payment-radio-dot" /></div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</p>
              </div>
              {paymentMethod === key && <CheckCircle2 size={18} color="var(--primary)" />}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bottom-cta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Total Amount</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit,var(--font-sans)' }}>{formatCurrency(total)}</p>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Seat #{seat.seat_number} Held</p>
        </div>
        <button className="btn btn-primary" onClick={handlePay} disabled={loading || !paymentMethod} style={{ height: 56, fontSize: 15 }}>
          {loading ? (
            <><div className="spin" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /><span>Processing...</span></>
          ) : (
            <><ShieldCheck size={20} /><span>Pay {formatCurrency(total)}</span></>
          )}
        </button>
      </div>
    </div>
  );
}
