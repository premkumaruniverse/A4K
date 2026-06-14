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

          {/* Route Toggle replaced with vertical stacked selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {Object.values(ROUTES).map((r) => {
              const isSelected = route === r.key;
              const isKgpToCcu = r.key === 'KGP_CCU';

              return (
                <button
                  key={r.key}
                  onClick={() => setLocalRoute(r.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 14px',
                    borderRadius: 18,
                    border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                    background: isSelected ? 'var(--primary-light)' : '#fff',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.08)' : 'none',
                  }}
                >
                  {/* Radio Indicator */}
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected ? '2.5px solid #10B981' : '2px solid var(--border)',
                    background: isSelected ? '#34D399' : 'transparent',
                    marginRight: 14,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isSelected && (
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#fff'
                      }} />
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Top Row: Cities and Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      {/* Origin City */}
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isKgpToCcu ? 'Kharagpur' : 'Kolkata'}
                      </span>

                      {/* Arrow Line */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, padding: '0 10px' }}>
                        <div style={{ height: 2, background: isSelected ? 'var(--primary)' : 'var(--border)', flex: 1 }} />
                        <div style={{ 
                          width: 0, height: 0, 
                          borderTop: '4px solid transparent', 
                          borderBottom: '4px solid transparent', 
                          borderLeft: `6px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, 
                          marginLeft: -2 
                        }} />
                      </div>

                      {/* Destination City */}
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                        {isKgpToCcu ? 'Kolkata' : 'Kharagpur'}
                      </span>
                    </div>

                    {/* Bottom Row: Stops Metadata */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* Origin Stops */}
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, opacity: 0.85 }}>
                        {isKgpToCcu ? '@IIT @Station @Chowrangee' : '@Airport @Metro @Station'}
                      </span>

                      {/* Destination Stops */}
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, opacity: 0.85, textAlign: 'right' }}>
                        {isKgpToCcu ? '@Airport @Metro @Station' : '@IIT @Station @Chowrangee'}
                      </span>
                    </div>
                  </div>
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

      {/* Boarding Points Section */}
      <div style={{ padding: '24px 20px 0' }} className="fade-up">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Outfit, var(--font-sans)' }}>
          <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          Boarding & Drop-off Points
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Kharagpur Column */}
          <div style={{
            background: '#fff',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            padding: '16px 14px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 }}>
              Kharagpur
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'IIT Gate',
                'Station',
                'Chowrangee'
              ].map((stop, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    color: 'var(--primary)',
                    fontWeight: 900,
                    fontSize: 14,
                    fontFamily: 'Outfit, var(--font-sans)',
                    background: 'var(--primary-light)',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>@</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kolkata Column */}
          <div style={{
            background: '#fff',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            padding: '16px 14px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 }}>
              Kolkata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Airport',
                'Metro',
                'Station'
              ].map((stop, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    color: 'var(--primary)',
                    fontWeight: 900,
                    fontSize: 14,
                    fontFamily: 'Outfit, var(--font-sans)',
                    background: 'var(--primary-light)',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>@</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stop}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
