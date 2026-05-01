import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Calendar, ArrowRight, MapPin, Truck, User } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import useBookingStore, { ROUTES } from '../stores/bookingStore';
import useAuthStore from '../stores/authStore';
import { todayStr } from '../utils/helpers';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedRoute, travelDate, setRoute, setDate } = useBookingStore();

  const [route, setLocalRoute] = useState(selectedRoute?.key || 'KGP_CCU');
  const [date, setLocalDate]   = useState(travelDate || todayStr());

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSearch = () => {
    setRoute(route);
    setDate(date);
    navigate('/travellers');
  };

  const activeRoute = ROUTES[route];

  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(145deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
        padding: '44px 24px 70px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div className="fade-up">
            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{getGreeting()}</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, var(--font-sans)', letterSpacing: '-0.02em' }}>
              {user?.name ? `Hi, ${user.name.split(' ')[0]}!` : 'KGP Shuttle'}
            </h1>
            <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Kharagpur ↔ Kolkata Airport</p>
          </div>
          <button
            onClick={() => navigate(user ? '/profile' : '/profile')}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {user ? <span style={{ fontSize: 16, fontWeight: 800 }}>{(user.name || 'U')[0].toUpperCase()}</span> : <User size={18} />}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Daily Trips', value: '12+' },
            { label: 'Fixed Price', value: '₹450' },
            { label: 'Travel Time', value: '3 hrs' },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Outfit, var(--font-sans)' }}>{value}</p>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search Card */}
      <div style={{ padding: '0 20px', marginTop: -36, zIndex: 10, position: 'relative' }}>
        <div className="card fade-up" style={{ boxShadow: 'var(--shadow-xl)', padding: 24, border: 'none', borderRadius: 24 }}>
          {/* Route Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MapPin size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Select Route</span>
          </div>

          {/* Route Toggle */}
          <div className="route-toggle" style={{ marginBottom: 20 }}>
            {Object.values(ROUTES).map((r) => (
              <button
                key={r.key}
                className={`route-btn ${route === r.key ? 'active' : ''}`}
                onClick={() => setLocalRoute(r.key)}
              >
                <span className="route-btn-label">{r.key === 'KGP_CCU' ? 'From KGP' : 'From CCU'}</span>
                <span className="route-btn-cities">{r.from}<br />→ {r.to}</span>
              </button>
            ))}
          </div>

          {/* Route Summary */}
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Truck size={18} color="var(--primary)" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>17-Seater Traveller</p>
              <p style={{ fontSize: 14, fontWeight: 800 }}>{activeRoute.from} → {activeRoute.to}</p>
            </div>
            <button onClick={() => setLocalRoute(route === 'KGP_CCU' ? 'CCU_KGP' : 'KGP_CCU')}
              style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ArrowLeftRight size={16} />
            </button>
          </div>

          {/* Date */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Travel Date</p>
                <input type="date" value={date} min={todayStr()} onChange={(e) => setLocalDate(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', padding: 0 }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSearch} style={{ height: 56, fontSize: 15, borderRadius: 16 }}>
            <ArrowRight size={20} />
            View Available Travellers
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>How it works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '01', title: 'Select Route & Date', desc: 'Choose your direction and travel date' },
            { step: '02', title: 'Pick a Seat', desc: 'Select your preferred seat from the 17-seater layout' },
            { step: '03', title: 'Verify & Pay', desc: 'OTP login + instant payment confirmation' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--primary)' }}>{step}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
