import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ticket, Settings, Shield, Phone, ChevronRight, User, LogIn, Camera, Edit2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import InlineAuth from '../components/InlineAuth';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../services/api';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profile_photo_url: user?.profile_photo_url || ''
  });

  const isAdmin = user?.is_admin;

  // Sync formData with user state
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profile_photo_url: user.profile_photo_url || ''
      });
    }
  }, [user, showEdit]);

  // Sync user state with backend on mount
  useEffect(() => {
    if (token) {
      authAPI.getProfile()
        .then(res => {
          updateUser(res.data);
        })
        .catch(err => {
          console.error("Failed to sync profile:", err);
        });
    }
  }, [token]);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data);
      toast.success('Profile updated!');
      setShowEdit(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const tId = toast.loading('Uploading photo...');
    try {
      const res = await authAPI.uploadPhoto(file);
      setFormData({ ...formData, profile_photo_url: res.data.image_url });
      toast.success('Photo uploaded!', { id: tId });
    } catch (err) {
      toast.error('Failed to upload', { id: tId });
    } finally {
      setUploading(false);
    }
  };

  const initials = (user.name || user.phone || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '44px 24px 60px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900 }}>Profile</h1>
          <button 
            onClick={() => setShowEdit(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              padding: '6px 12px', borderRadius: 20, 
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', 
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              zIndex: 20, position: 'relative'
            }}
          >
            <Edit2 size={14} /> Edit
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar-ring">
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />
            ) : (
              <div className="avatar-inner">{initials}</div>
            )}
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

      {showEdit && (
        <Modal title="Edit Profile" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 10px' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg)', overflow: 'hidden', border: '3px solid var(--primary-light)' }}>
                {formData.profile_photo_url ? (
                  <img src={formData.profile_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <User size={40} />
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                {uploading ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Full Name</label>
              <input required className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowEdit(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || uploading} style={{ flex: 1 }}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <BottomNav />
    </div>
  );
}
