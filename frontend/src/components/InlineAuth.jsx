import { useState, useRef, useEffect } from 'react';
import { Phone, ArrowRight, RefreshCw, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import useSagaStore from '../stores/sagaStore';
import { getErrorMessage } from '../utils/helpers';

export default function InlineAuth({ onSuccess, onCancel }) {
  const { login } = useAuthStore();
  const { authDone } = useSagaStore();

  const [step, setStep]         = useState('phone');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState(['','','','','','']);
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(0);
  const [devOtp, setDevOtp]     = useState('');
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSend = async () => {
    if (phone.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(phone);
      const { dev_otp } = res.data;
      if (dev_otp) {
        setDevOtp(dev_otp);
        setOtp(dev_otp.split(''));
        toast.success(`Dev OTP: ${dev_otp}`, { duration: 10000, icon: '🔑' });
      } else {
        toast.success('OTP sent!');
      }
      setStep('otp');
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleOTPChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOTPKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter complete OTP'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, code);
      login(res.data.access_token, res.data.user);
      authDone();
      toast.success('Verified! Proceeding to payment...');
      onSuccess?.(res.data.user);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: '0 24px 32px' }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 20px' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
              {step === 'phone' ? 'Verify Your Number' : 'Enter OTP'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              {step === 'phone' ? 'Required to confirm your booking' : `Code sent to +91 ${phone}`}
            </p>
          </div>
          <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Security badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--success-bg)', padding: '10px 14px', borderRadius: 12, marginBottom: 24 }}>
          <Shield size={16} color="var(--success)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Your seat is temporarily reserved while you verify</span>
        </div>

        {step === 'phone' ? (
          <>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 800, paddingRight: 12, borderRight: '1.5px solid var(--border)', color: 'var(--text-primary)', zIndex: 1 }}>+91</div>
              <input
                className="input-field"
                type="tel" maxLength={10} placeholder="98765 43210" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ paddingLeft: 64, height: 56, fontSize: 16, fontWeight: 700 }} autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleSend} disabled={loading || phone.length !== 10} style={{ height: 54, fontSize: 15 }}>
              {loading ? <div className="spin" style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : <><span>Send OTP</span><ArrowRight size={18} /></>}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
              {otp.map((d, i) => (
                <input key={i} ref={el => otpRefs.current[i] = el} type="tel" maxLength={1} value={d}
                  onChange={e => handleOTPChange(i, e.target.value)}
                  onKeyDown={e => handleOTPKey(i, e)}
                  style={{ width: 46, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 800, border: '2px solid var(--border)', borderRadius: 12, outline: 'none', background: 'var(--bg)', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px var(--primary-light)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg)'; e.target.style.boxShadow = 'none'; }}
                />
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleVerify} disabled={loading || otp.join('').length !== 6} style={{ height: 54, fontSize: 15, marginBottom: 16 }}>
              {loading ? <div className="spin" style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Verify & Continue'}
            </button>
            <div style={{ textAlign: 'center' }}>
              {timer > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resend in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong></p>
              ) : (
                <button onClick={() => { setOtp(['','','','','','']); handleSend(); }} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} /> Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
