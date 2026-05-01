import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { getErrorMessage } from '../utils/helpers';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [step, setStep]         = useState('phone');   // 'phone' | 'otp'
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setTimer] = useState(0);
  const [devOtp, setDevOtp]     = useState('');

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSendOTP = async () => {
    if (phone.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(phone);
      const { dev_otp } = res.data;
      if (dev_otp) {
        setDevOtp(dev_otp);
        toast.success(`Dev OTP: ${dev_otp}`, { duration: 10000, icon: '🔑' });
        setOtp(dev_otp.split(''));
      } else {
        toast.success('OTP sent successfully!');
      }
      setStep('otp');
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOTPKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, code);
      login(res.data.access_token, res.data.user);
      toast.success('Welcome back!');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
        padding: '64px 24px 80px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {step === 'otp' && (
          <button onClick={() => setStep('phone')} style={{ color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
            <span style={{ fontWeight: 500 }}>Back</span>
          </button>
        )}

        <div className="fade-up">
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            {step === 'phone' ? 'Welcome!' : 'Check your phone'}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, fontWeight: 500 }}>
            {step === 'phone'
              ? 'Login or sign up with your mobile number'
              : `We've sent a 6-digit code to +91 ${phone}`}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass" style={{
        flex: 1,
        background: 'var(--surface)',
        borderRadius: '32px 32px 0 0',
        marginTop: -32,
        padding: '32px 24px',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {step === 'phone' ? (
          <div className="fade-up">
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10, marginLeft: 4 }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  position: 'absolute', left: 16, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                  paddingRight: 12, borderRight: '1.5px solid var(--border)'
                }}>
                  +91
                </div>
                <input
                  className="input-field"
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  style={{ paddingLeft: 64, fontSize: 16, fontWeight: 600, height: 56 }}
                  autoFocus
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
              style={{ height: 56, fontSize: 16 }}
            >
              {loading ? (
                <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'loading 1s linear infinite' }} />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.6 }}>
              By continuing, you agree to our <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>.
            </p>
          </div>
        ) : (
          <div className="fade-up">
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 20, textAlign: 'center' }}>
                Enter verification code
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    style={{
                      width: 48, height: 60, textAlign: 'center',
                      fontSize: 24, fontWeight: 700,
                      border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
                      outline: 'none', background: 'var(--bg)',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 4px var(--primary-light)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.background = 'var(--bg)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              style={{ height: 56, fontSize: 16, marginBottom: 24 }}
            >
              {loading ? (
                <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'loading 1s linear infinite' }} />
              ) : 'Verify OTP'}
            </button>

            <div style={{ textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Resend code in <strong style={{ color: 'var(--text-primary)' }}>{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  style={{
                    color: 'var(--primary)', fontWeight: 700, fontSize: 15,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={16} /> Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
