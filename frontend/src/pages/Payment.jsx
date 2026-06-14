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
  const { selectedTraveller, selectedCab, setCurrentBooking, reset } = useBookingStore();
  const { sagaState, lockedSeat, lockExpiresAt, paymentMethod, setPaymentMethod, initPayment, verifyPayment, rollback, error } = useSagaStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [secsLeft, setSecsLeft] = useState(300);
  const [isNewUser, setIsNewUser] = useState(!user?.name);
  const [passengerName, setPassengerName] = useState(user?.name || '');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const isCabMode = !!selectedCab && !selectedTraveller;

  useEffect(() => {
    if (isCabMode || !lockedSeat || sagaState === 'CONFIRMED') return;
    if (!lockExpiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt) - Date.now()) / 1000));
      setSecsLeft(diff);
      if (diff === 0) { toast.error('Seat reservation expired!'); navigate(-1); }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockExpiresAt, sagaState, navigate, lockedSeat, isCabMode]);

  // Redirect if prerequisites not met
  if (!isCabMode && (!lockedSeat || !selectedTraveller)) { navigate('/home'); return null; }

  const ride = selectedTraveller;
  const seat = lockedSeat;
  const baseFare = isCabMode ? selectedCab.fare : (seat?.price || ride?.price || 0);
  const taxes = Math.round((baseFare - discount) * 0.05 * 100) / 100;
  const total = Math.round((baseFare - discount + taxes) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await import('../services/api').then(m => m.travellerAPI.verifyCoupon(couponCode));
      setDiscount(res.data.discount_amount);
      toast.success(`₹${res.data.discount_amount} Coupon Applied!`);
    } catch (err) {
      setDiscount(0);
      toast.error('Invalid or expired coupon');
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const finalName = isNewUser ? (passengerName || 'Traveller') : (user?.name || user?.phone || 'Traveller');

      let booking;
      if (isCabMode) {
        booking = await initPayment(null, finalName, {
          cab_id: selectedCab.id,
          from_city: selectedCab.from_city,
          to_city: selectedCab.to_city,
        });
      } else {
        booking = await initPayment(ride.id, finalName);
      }

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

      {/* Seat timer — shuttle only */}
      {!isCabMode && (
        <div style={{ margin: '16px 20px 0' }}>
          <div className="lock-timer">
            <Clock size={14} />
            <span>Seat held for <strong>{m}:{s.toString().padStart(2,'0')}</strong></span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* Booking Summary */}
        <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passenger Details</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Booking for a new passenger?</span>
            <div 
              onClick={() => setIsNewUser(!isNewUser)} 
              style={{ width: 44, height: 24, borderRadius: 12, background: isNewUser ? 'var(--primary)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: isNewUser ? 22 : 2, transition: '0.3s' }} />
            </div>
          </div>
          {isNewUser && (
            <input 
              type="text" 
              placeholder="Enter Passenger Name" 
              className="input-field" 
              value={passengerName} 
              onChange={e => setPassengerName(e.target.value)} 
              style={{ width: '100%', marginBottom: 16 }} 
            />
          )}
        </div>

        <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Summary</h3>

          {(isCabMode ? [
            { label: 'Vehicle',    value: selectedCab.name },
            { label: 'Type',       value: selectedCab.type },
            { label: 'Cab Number', value: selectedCab.cab_number || 'Pending Assignment', bold: true, color: selectedCab.cab_number ? 'var(--primary)' : 'var(--danger)' },
            { label: 'Route',      value: `${selectedCab.from_city} → ${selectedCab.to_city}` },
            { label: 'Driver',     value: selectedCab.driver.name },
            { label: 'ETA',        value: `${selectedCab.eta_minutes} min` },
          ] : [
            { label: 'Route',      value: `${ride.from_city} → ${ride.to_city}` },
            { label: 'Departure',  value: formatTime(ride.departure_time) },
            { label: 'Arrival',    value: formatTime(ride.arrival_time) },
            { label: 'Seat',       value: `Seat #${seat.seat_number}`, bold: true },
            { label: 'Operator',   value: ride.operator_name },
          ]).map(({ label, value, bold, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: bold ? 800 : 700, color: color || (bold ? 'var(--primary)' : 'var(--text-primary)') }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px dashed var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Base Fare</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(baseFare)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>Discount applied</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>GST (5%)</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(taxes)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'Outfit,var(--font-sans)' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="card" style={{ padding: 20, border: 'none', boxShadow: 'var(--shadow-md)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offers & Promos</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="text" 
              placeholder="Enter coupon code" 
              className="input-field" 
              value={couponCode} 
              onChange={e => setCouponCode(e.target.value)} 
              style={{ flex: 1, textTransform: 'uppercase' }} 
            />
            <button className="btn btn-outline" style={{ width: 'auto', padding: '0 16px' }} onClick={handleApplyCoupon}>
              Apply
            </button>
          </div>
          {discount === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Try FIRST50 or SAVE50</p>}
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
          {!isCabMode && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Seat #{seat?.seat_number} Held</p>}
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
