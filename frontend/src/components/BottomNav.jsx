import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Ticket, User, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.is_admin;

  const items = [
    { path: '/home',     Icon: Home,   label: 'Home' },
    { path: '/bookings', Icon: Ticket, label: 'Bookings' },
    { path: '/profile',  Icon: User,   label: 'Profile' },
    ...(isAdmin ? [{ path: '/admin', Icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ path, Icon, label }) => {
        const active = pathname === path;
        return (
          <button key={path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(path)}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
