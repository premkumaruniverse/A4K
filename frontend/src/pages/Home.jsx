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
  const [date, setLocalDate] = useState(travelDate || todayStr());

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div className="fade-up">
            <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Outfit, var(--font-sans)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              KGP Shuttle
            </h1>
            <p style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, letterSpacing: '0.01em' }}>
              Travel Easy &bull; Travel Comfort - Travel Less
            </p>
          </div>
          <button
            onClick={() => navigate(user ? '/profile' : '/profile')}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {user ? <span style={{ fontSize: 16, fontWeight: 800 }}>{(user.name || 'U')[0].toUpperCase()}</span> : <User size={18} />}
          </button>
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

          {/* Route Selection - Two Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {Object.values(ROUTES).map((r) => {
              const isSelected = route === r.key;
              const isKgpToCcu = r.key === 'KGP_CCU';

              return (
                <button
                  key={r.key}
                  onClick={() => setLocalRoute(r.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: isSelected ? '#F0F5FF' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {isKgpToCcu ? 'Kharagpur' : 'Kolkata'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', marginTop: 2 }}>
                    → {isKgpToCcu ? 'Kolkata' : 'Kharagpur'}
                  </span>
                </button>
              );
            })}
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

      {/* Route Map Section */}
      <div style={{ padding: '24px 20px 0' }} className="fade-up">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Outfit, var(--font-sans)' }}>
          <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          Route Map
        </h2>
        <img
          src={route === 'KGP_CCU' ? '/route-kgp-ccu.png' : '/route-ccu-kgp.png'}
          alt={route === 'KGP_CCU' ? 'Kharagpur to Kolkata route' : 'Kolkata to Kharagpur route'}
          style={{
            width: '100%',
            borderRadius: 16,
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
      </div>

      <BottomNav />
    </div>
  );
}
