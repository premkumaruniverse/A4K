import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Truck, Users, ChevronDown, ChevronUp, Edit2, Trash2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { formatTime, formatDate, formatCurrency } from '../utils/helpers';
import { todayStr } from '../utils/helpers';

function SeatStatusGrid({ seats }) {
  return (
    <div className="admin-seat-grid">
      {seats.map(s => (
        <div key={s.id} className={`admin-seat ${s.status === 'booked' || s.status === 'blocked' ? 'booked' : s.status === 'locked' ? 'locked' : 'available'}`}>
          {s.seat_number}
        </div>
      ))}
    </div>
  );
}

function TravellerRow({ t, onEdit, onDeactivate }) {
  const [expanded, setExpanded] = useState(false);
  const booked = t.seats?.filter(s => s.status === 'booked' || s.status === 'blocked').length || 0;
  const total = t.total_seats || 17;
  const pct = Math.round((booked / total) * 100);

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800 }}>{t.from_city} → {t.to_city}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{formatDate(t.departure_time)} · {formatTime(t.departure_time)} → {formatTime(t.arrival_time)}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onEdit(t)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit2 size={14} color="var(--primary)" />
            </button>
            <button onClick={() => onDeactivate(t.id)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--danger-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={14} color="var(--danger)" />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{booked}/{total} seats booked</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3 }}>
            <div style={{ height: '100%', borderRadius: 3, background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)', width: `${pct}%`, transition: 'width 0.5s' }} />
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide' : 'View'} Seat Map
        </button>
      </div>

      {expanded && t.seats?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
          <SeatStatusGrid seats={t.seats} />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {[{ color: '#86EFAC', label: 'Available' }, { color: '#FCA5A5', label: 'Booked' }, { color: '#FDE68A', label: 'Locked' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('travellers');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ from_city: 'Kharagpur', to_city: 'Kolkata Airport', departure_time: '', arrival_time: '', price: 450, total_seats: 17, image_url: '' });

  if (!user?.is_admin) { navigate('/home'); return null; }

  const { data: travData, isLoading: tLoad } = useQuery({ queryKey: ['admin-travellers'], queryFn: () => adminAPI.getTravellers().then(r => r.data) });
  const { data: bookData, isLoading: bLoad } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => adminAPI.getBookings().then(r => r.data), enabled: tab === 'bookings' });

  const createMut = useMutation({
    mutationFn: (d) => adminAPI.createTraveller(d),
    onSuccess: () => { qc.invalidateQueries(['admin-travellers']); setShowCreate(false); toast.success('Traveller created!'); },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateTraveller(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-travellers']); setEditTarget(null); toast.success('Updated!'); },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Error'),
  });
  const deactivateMut = useMutation({
    mutationFn: (id) => adminAPI.deleteTraveller(id),
    onSuccess: () => { qc.invalidateQueries(['admin-travellers']); toast.success('Deactivated'); },
  });

  const travellers = travData || [];
  const bookings = bookData?.bookings || [];
  const totalBooked = travellers.reduce((s, t) => s + (t.seats?.filter(s => s.status === 'booked' || s.status === 'blocked').length || 0), 0);
  const totalSeats = travellers.reduce((s, t) => s + (t.total_seats || 17), 0);

  const handleSave = () => {
    const payload = { ...form, departure_time: new Date(form.departure_time).toISOString(), arrival_time: new Date(form.arrival_time).toISOString() };
    if (editTarget) updateMut.mutate({ id: editTarget.id, data: payload });
    else createMut.mutate(payload);
  };

  const startEdit = (t) => {
    setEditTarget(t);
    const fmtLocal = (dt) => dt ? new Date(dt).toISOString().slice(0, 16) : '';
    setForm({ from_city: t.from_city, to_city: t.to_city, departure_time: fmtLocal(t.departure_time), arrival_time: fmtLocal(t.arrival_time), price: t.price, total_seats: t.total_seats, image_url: t.image_url || '' });
    setShowCreate(true);
  };

  return (
    <div className="page" style={{ paddingBottom: 40, background: 'var(--bg)' }}>
      {/* Header */}
      <div className="admin-header">
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)' }}>Admin Panel</h1>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>KGP Shuttle Management</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Travellers', value: travellers.length },
            { label: 'Seats Booked', value: totalBooked },
            { label: 'Total Bookings', value: bookings.length || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Outfit,var(--font-sans)' }}>{value}</p>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        {[{ key: 'travellers', label: 'Travellers', Icon: Truck }, { key: 'bookings', label: 'Bookings', Icon: BarChart2 }].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '14px 0', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, color: tab === key ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: tab === key ? '2.5px solid var(--primary)' : '2.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'travellers' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => { setEditTarget(null); setForm({ from_city: 'Kharagpur', to_city: 'Kolkata Airport', departure_time: '', arrival_time: '', price: 450, total_seats: 17 }); setShowCreate(true); }}>
                <Plus size={16} /> Add Traveller
              </button>
            </div>
            {tLoad ? [1,2].map(i => <div key={i} className="skeleton" style={{ height: 140, marginBottom: 12 }} />) : travellers.map(t => (
              <TravellerRow key={t.id} t={t} onEdit={startEdit} onDeactivate={(id) => deactivateMut.mutate(id)} />
            ))}
          </>
        ) : (
          bLoad ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />) :
          bookings.length === 0 ? <div className="empty-state"><p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No bookings yet</p></div> :
          bookings.map(b => (
            <div key={b.id} className="booking-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontWeight: 800 }}>{b.booking_ref}</p>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-confirmed' : b.status === 'pending' ? 'badge-pending' : 'badge-cancelled'}`}>{b.status}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{b.ride?.from_city} → {b.ride?.to_city} · {b.ride?.departure_time ? formatTime(b.ride.departure_time) : '—'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {b.user?.name || b.user?.phone} · Seat {b.seat_numbers?.join(', ')}
                </p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(b.total_price)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: '0 24px 32px', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '20px 0 20px' }}>{editTarget ? 'Edit Traveller' : 'Add New Traveller'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ f: 'Kharagpur', t: 'Kolkata Airport' }, { f: 'Kolkata Airport', t: 'Kharagpur' }].map(({ f, t }) => (
                    <button key={f} onClick={() => setForm(prev => ({ ...prev, from_city: f, to_city: t }))}
                      style={{ padding: '10px 8px', borderRadius: 12, border: `2px solid ${form.from_city === f ? 'var(--primary)' : 'var(--border)'}`, background: form.from_city === f ? 'var(--primary-light)' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: form.from_city === f ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {f.slice(0, 3)} → {t.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'Departure Time', key: 'departure_time', type: 'datetime-local' },
                { label: 'Arrival Time',   key: 'arrival_time',   type: 'datetime-local' },
                { label: 'Price (₹)',      key: 'price',          type: 'number' },
                { label: 'Total Seats',    key: 'total_seats',    type: 'number' },
                { label: 'Image URL',      key: 'image_url',      type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input className="input-field" type={type} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
                </div>
              ))}

              <button className="btn btn-primary" style={{ height: 52, marginTop: 8 }} onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Traveller'}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, padding: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
