import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ticket, Settings, Shield, Phone, ChevronRight, User, LogIn } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import InlineAuth from '../components/InlineAuth';
import useAuthStore from '../stores/authStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const isAdmin = user?.is_admin;

  if (!token || !user) {
    return (
      <div className="page" style={{ paddingBottom: 90 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '56px 24px 40px', color: '#fff', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <User size={36} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>Welcome to KGP Shuttle</h1>
          <p style={{ opacity: 0.8, fontSize: 13, marginTop: 8 }}>Login to manage your bookings</p>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Login safely with your phone number to manage bookings and view your trips.
          </p>
          <button className="btn btn-primary" style={{ height: 54, marginBottom: 16 }} onClick={() => setShowAuth(true)}>
            <LogIn size={18} /> Login
          </button>
        </div>
        <BottomNav />
        {showAuth && <InlineAuth onSuccess={() => setShowAuth(false)} onCancel={() => setShowAuth(false)} />}
      </div>
    );
  }

  const initials = (user.name || user.phone || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '44px 24px 60px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Profile</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar-ring">
            <div className="avatar-inner">{initials}</div>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{user.name || 'Traveller'}</p>
            <p style={{ fontSize: 13, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Phone size={12} /> +91 {user.phone}
            </p>
            {isAdmin && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: 6, display: 'inline-block' }}>Admin</span>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: -20, background: '#fff', borderRadius: '20px 20px 0 0', padding: '16px 0' }}>
        {[
          { Icon: Ticket,  label: 'My Bookings', sub: 'View all your trips', action: () => navigate('/bookings'), color: 'var(--primary)' },
          isAdmin && { Icon: Shield,  label: 'Admin Panel',  sub: 'Manage travellers & bookings', action: () => navigate('/admin'),    color: '#7C3AED' },
          { Icon: Settings, label: 'Settings',   sub: 'Account preferences',   action: () => {},              color: 'var(--text-secondary)' },
        ].filter(Boolean).map(({ Icon, label, sub, action, color }) => (
          <button key={label} className="menu-item" onClick={action}>
            <div className="menu-icon" style={{ background: color + '15' }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="menu-label">{label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</p>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>
        ))}

        <div style={{ height: 8, background: 'var(--bg)', margin: '8px 0' }} />

        <button className="menu-item" onClick={() => { logout(); navigate('/home'); }}>
          <div className="menu-icon" style={{ background: 'var(--danger-bg)' }}>
            <LogOut size={20} color="var(--danger)" />
          </div>
          <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--danger)', textAlign: 'left' }}>Sign Out</p>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
