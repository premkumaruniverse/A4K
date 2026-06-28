import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/home', { replace: true }), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="page" style={{
      background: 'linear-gradient(145deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24,
    }}>
      <div className="fade-up" style={{ textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, background: 'rgba(255,255,255,0.12)',
          borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.25)',
          margin: '0 auto 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontSize: 48,
        }}>
          🚐
        </div>
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, fontFamily: 'Outfit, var(--font-sans)' }}>
          KGP Shuttle
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 500 }}>Kharagpur ↔ Kolkata</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 48 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
            animation: `fadeUp 0.6s ease-in-out ${i * 0.18}s infinite alternate`,
          }} />
        ))}
      </div>
    </div>
  );
}
