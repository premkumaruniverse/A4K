import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Truck, Users, ChevronDown, ChevronUp, Edit2, Trash2, BarChart2, Upload, Loader, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { formatTime, formatDate, formatCurrency } from '../utils/helpers';

export default function AdminPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('travellers');

  useEffect(() => {
    if (user && !user.is_admin) {
      toast.error('Admin access required');
      navigate('/home');
    }
  }, [user, navigate]);

  const { data: travData, isLoading: tLoad, error: tErr } = useQuery({ 
    queryKey: ['admin-travellers'], 
    queryFn: () => adminAPI.getTravellers().then(r => r.data), 
    enabled: !!user?.is_admin 
  });
  
  const { data: bookData, isLoading: bLoad, error: bErr } = useQuery({ 
    queryKey: ['admin-bookings'], 
    queryFn: () => adminAPI.getBookings().then(r => r.data), 
    enabled: tab === 'bookings' && !!user?.is_admin 
  });

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Please login as admin</div>;
  if (!user.is_admin) return <div style={{ padding: 40, textAlign: 'center' }}>Access Denied (User: {user.phone})</div>;
  if (tLoad) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (tErr || bErr) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Error loading data</div>;

  const travellers = Array.isArray(travData) ? travData : [];
  const bookings = Array.isArray(bookData?.bookings) ? bookData.bookings : [];

  return (
    <div className="page" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>Admin Dashboard</h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Travellers</p>
          <p style={{ fontSize: 24, fontWeight: 900 }}>{travellers.length}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Bookings</p>
          <p style={{ fontSize: 24, fontWeight: 900 }}>{bookings.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => setTab('travellers')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: tab === 'travellers' ? 'var(--primary)' : 'var(--bg)', color: tab === 'travellers' ? '#fff' : 'var(--text-primary)', fontWeight: 700 }}>Travellers</button>
        <button onClick={() => setTab('bookings')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: tab === 'bookings' ? 'var(--primary)' : 'var(--bg)', color: tab === 'bookings' ? '#fff' : 'var(--text-primary)', fontWeight: 700 }}>Bookings</button>
      </div>

      <div>
        {tab === 'travellers' ? (
          travellers.map(t => (
            <div key={t.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 800 }}>{t.operator_name || 'Shuttle'}</p>
                <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(t.price)}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.from_city} → {t.to_city}</p>
            </div>
          ))
        ) : (
          <p>Bookings view coming soon...</p>
        )}
      </div>
    </div>
  );
}
