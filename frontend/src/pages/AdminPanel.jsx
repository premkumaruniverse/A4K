import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Truck, Edit2, Trash2, Ticket, Clock, Tag, Search, MapPin, X, DollarSign, Loader2, Image as ImageIcon, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI, cabAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { formatTime, formatDate, formatCurrency } from '../utils/helpers';

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

export default function AdminPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('travellers');
  const [editingRide, setEditingRide] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [editingCab, setEditingCab] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [isAddingCab, setIsAddingCab] = useState(false);
  const [searchRide, setSearchRide] = useState('');
  const [searchBooking, setSearchBooking] = useState('');
  const [searchCoupon, setSearchCoupon] = useState('');
  const [searchCab, setSearchCab] = useState('');

  useEffect(() => {
    if (user && !user.is_admin) {
      toast.error('Admin access required');
      navigate('/home');
    }
  }, [user, navigate]);

  const { data: travData, isLoading: tLoad } = useQuery({ 
    queryKey: ['admin-travellers'], 
    queryFn: () => adminAPI.getTravellers().then(r => r.data), 
    enabled: !!user?.is_admin 
  });
  
  const { data: bookData, isLoading: bLoad } = useQuery({ 
    queryKey: ['admin-bookings'], 
    queryFn: () => adminAPI.getBookings().then(r => r.data), 
    enabled: tab === 'bookings' && !!user?.is_admin 
  });

  const { data: couponData, isLoading: cLoad } = useQuery({ 
    queryKey: ['admin-coupons'], 
    queryFn: () => adminAPI.getCoupons().then(r => r.data), 
    enabled: tab === 'offers' && !!user?.is_admin 
  });

  const createMut = useMutation({
    mutationFn: adminAPI.createTraveller,
    onSuccess: () => { toast.success('Ride added successfully!'); qc.invalidateQueries(['admin-travellers']); setIsAdding(false); },
    onError: () => toast.error('Failed to add ride')
  });

  const updateMut = useMutation({
    mutationFn: ({id, data}) => adminAPI.updateTraveller(id, data),
    onSuccess: () => { toast.success('Ride updated!'); qc.invalidateQueries(['admin-travellers']); setEditingRide(null); },
    onError: () => toast.error('Failed to update ride')
  });

  const deleteMut = useMutation({
    mutationFn: adminAPI.deleteTraveller,
    onSuccess: () => { toast.success('Ride removed!'); qc.invalidateQueries(['admin-travellers']); },
    onError: () => toast.error('Failed to remove ride')
  });

  const createCouponMut = useMutation({
    mutationFn: adminAPI.createCoupon,
    onSuccess: () => { toast.success('Coupon created!'); qc.invalidateQueries(['admin-coupons']); setIsAddingCoupon(false); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create coupon')
  });

  const updateCouponMut = useMutation({
    mutationFn: ({id, data}) => adminAPI.updateCoupon(id, data),
    onSuccess: () => { toast.success('Coupon updated!'); qc.invalidateQueries(['admin-coupons']); setEditingCoupon(null); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update coupon')
  });

  const deleteCouponMut = useMutation({
    mutationFn: adminAPI.deleteCoupon,
    onSuccess: () => { toast.success('Coupon deleted!'); qc.invalidateQueries(['admin-coupons']); },
    onError: () => toast.error('Failed to delete coupon')
  });

  const { data: cabData, isLoading: cabLoad } = useQuery({
    queryKey: ['admin-cabs'],
    queryFn: () => cabAPI.getAll().then(r => r.data),
    enabled: tab === 'cabs' && !!user?.is_admin
  });

  const createCabMut = useMutation({
    mutationFn: cabAPI.create,
    onSuccess: () => { toast.success('Cab added!'); qc.invalidateQueries(['admin-cabs']); setIsAddingCab(false); },
    onError: () => toast.error('Failed to add cab')
  });

  const updateCabMut = useMutation({
    mutationFn: ({ id, data }) => cabAPI.update(id, data),
    onSuccess: () => { toast.success('Cab updated!'); qc.invalidateQueries(['admin-cabs']); setEditingCab(null); },
    onError: () => toast.error('Failed to update cab')
  });

  const deleteCabMut = useMutation({
    mutationFn: cabAPI.remove,
    onSuccess: () => { toast.success('Cab removed!'); qc.invalidateQueries(['admin-cabs']); },
    onError: () => toast.error('Failed to remove cab')
  });

  if (!user || !user.is_admin) return null;

  const travellers = Array.isArray(travData) ? travData : [];
  const bookings = Array.isArray(bookData?.bookings) ? bookData.bookings : [];
  const coupons = Array.isArray(couponData) ? couponData : [];
  const cabs = Array.isArray(cabData) ? cabData : [];
  
  const activeTravellers = travellers.filter(t => t.is_active !== false);

  const filteredTravellers = activeTravellers.filter(t => 
    t.operator_name.toLowerCase().includes(searchRide.toLowerCase()) ||
    t.from_city.toLowerCase().includes(searchRide.toLowerCase()) ||
    t.to_city.toLowerCase().includes(searchRide.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => 
    b.booking_ref.toLowerCase().includes(searchBooking.toLowerCase()) ||
    (b.user?.name || b.user?.phone || '').toLowerCase().includes(searchBooking.toLowerCase())
  );

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchCoupon.toLowerCase())
  );

  const filteredCabs = cabs.filter(c =>
    c.is_active !== false &&
    (c.name.toLowerCase().includes(searchCab.toLowerCase()) ||
    c.type.toLowerCase().includes(searchCab.toLowerCase()))
  );

  const CabForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      type: initialData?.type || 'Sedan',
      fare: initialData?.fare || 500,
      capacity: initialData?.capacity || 4,
      eta_minutes: initialData?.eta_minutes || 5,
      amenities: (initialData?.amenities || []).join(', '),
      image_url: initialData?.image_url || '',
      driver_name: initialData?.driver?.name || '',
      driver_phone: initialData?.driver?.phone || 'XXXXXXXXXX',
      driver_rating: initialData?.driver?.rating || 4.5,
      driver_trips: initialData?.driver?.trips || 0,
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({
        name: formData.name,
        type: formData.type,
        fare: Number(formData.fare),
        capacity: Number(formData.capacity),
        eta_minutes: Number(formData.eta_minutes),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        image_url: formData.image_url,
        driver: {
          name: formData.driver_name,
          phone: formData.driver_phone,
          rating: Number(formData.driver_rating),
          trips: Number(formData.driver_trips),
        },
      });
    };

    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Vehicle Name</label>
            <input required className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Swift Dzire" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Type</label>
            <select className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Hatchback</option>
              <option>Auto</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Fare (₹)</label>
            <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.fare} onChange={e => setFormData({ ...formData, fare: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Capacity</label>
            <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>ETA (min)</label>
            <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.eta_minutes} onChange={e => setFormData({ ...formData, eta_minutes: e.target.value })} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Amenities (comma-separated)</label>
          <input className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="AC, Music, WiFi" />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>DRIVER DETAILS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Driver Name</label>
              <input required className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.driver_name} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Phone</label>
              <input className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.driver_phone} onChange={e => setFormData({ ...formData, driver_phone: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Rating</label>
              <input type="number" step="0.1" min="1" max="5" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.driver_rating} onChange={e => setFormData({ ...formData, driver_rating: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Total Trips</label>
              <input type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.driver_trips} onChange={e => setFormData({ ...formData, driver_trips: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Vehicle Image</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <input type="file" accept="image/*" className="input-field" style={{ flex: 1, padding: 8 }} onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const tId = toast.loading('Uploading image...');
              try {
                const res = await adminAPI.uploadImage(file);
                setFormData({ ...formData, image_url: res.data.image_url });
                toast.success('Image uploaded!', { id: tId });
              } catch {
                toast.error('Failed to upload', { id: tId });
              }
            }} />
          </div>
          {formData.image_url && <img src={formData.image_url} style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} alt="Preview" />}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Save Cab'}
          </button>
        </div>
      </form>
    );
  };

  const TravellerForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const toLocalISO = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
      operator_name: initialData?.operator_name || 'KGP Shuttle Service',
      from_city: initialData?.from_city || 'Kharagpur',
      to_city: initialData?.to_city || 'Kolkata Airport',
      departure_time: toLocalISO(initialData?.departure_time),
      arrival_time: toLocalISO(initialData?.arrival_time),
      price: initialData?.price || 500,
      total_seats: initialData?.total_seats || 17,
      image_url: initialData?.image_url || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        departure_time: formData.departure_time.length === 16 ? formData.departure_time + ':00' : formData.departure_time,
        arrival_time: formData.arrival_time.length === 16 ? formData.arrival_time + ':00' : formData.arrival_time,
        price: Number(formData.price),
        total_seats: Number(formData.total_seats)
      });
    };

    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Route</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <select className="input-field" style={{ flex: 1 }} value={formData.from_city} onChange={e => setFormData({...formData, from_city: e.target.value, to_city: e.target.value === 'Kharagpur' ? 'Kolkata Airport' : 'Kharagpur'})}>
              <option value="Kharagpur">Kharagpur</option>
              <option value="Kolkata Airport">Kolkata Airport</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center' }}>→</div>
            <input className="input-field" style={{ flex: 1 }} value={formData.to_city} disabled />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Operator Name</label>
          <input required className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.operator_name} onChange={e => setFormData({...formData, operator_name: e.target.value})} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Departure</label>
            <input required type="datetime-local" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Arrival</label>
            <input required type="datetime-local" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.arrival_time} onChange={e => setFormData({...formData, arrival_time: e.target.value})} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Base Price (₹)</label>
            <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Total Seats</label>
            <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.total_seats} disabled={!!initialData} onChange={e => setFormData({...formData, total_seats: e.target.value})} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Vehicle Image</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <input type="file" accept="image/*" className="input-field" style={{ flex: 1, padding: 8 }} onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const tId = toast.loading('Uploading image...');
              try {
                const res = await adminAPI.uploadImage(file);
                setFormData({...formData, image_url: res.data.image_url});
                toast.success('Image uploaded!', { id: tId });
              } catch (err) {
                toast.error('Failed to upload', { id: tId });
              }
            }} />
          </div>
          {formData.image_url && <img src={formData.image_url} style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} alt="Preview" />}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Save Details'}
          </button>
        </div>
      </form>
    );
  };

  const CouponForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
      code: initialData?.code || '',
      discount_amount: initialData?.discount_amount || 50,
      is_active: initialData?.is_active ?? true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Coupon Code</label>
          <input required className="input-field" style={{ width: '100%', marginTop: 4, textTransform: 'uppercase' }} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="E.G. SAVE50" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Discount Amount (₹)</label>
          <input required type="number" className="input-field" style={{ width: '100%', marginTop: 4 }} value={formData.discount_amount} onChange={e => setFormData({...formData, discount_amount: Number(e.target.value)})} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="coupon_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
          <label htmlFor="coupon_active" style={{ fontSize: 13, fontWeight: 600 }}>Active</label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Save Coupon'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="page" style={{ padding: 20, paddingBottom: 80, background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/profile')} className="btn-icon" style={{ background: '#fff' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: 20, fontWeight: 900 }}>Admin Dashboard</h1>
        </div>
      </div>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Truck size={16} color="var(--primary)" />
          </div>
          <p style={{ fontSize: 24, fontWeight: 900 }}>{activeTravellers.length}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active Rides</p>
        </div>
        <div className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Ticket size={16} color="var(--success)" />
          </div>
          <p style={{ fontSize: 24, fontWeight: 900 }}>{bookData?.total || 0}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#fff', padding: 4, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <button onClick={() => setTab('travellers')} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: tab === 'travellers' ? 'var(--primary)' : 'transparent', color: tab === 'travellers' ? '#fff' : 'var(--text-muted)', fontWeight: 700, transition: '0.2s', fontSize: 13 }}>Rides</button>
        <button onClick={() => setTab('cabs')} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: tab === 'cabs' ? 'var(--primary)' : 'transparent', color: tab === 'cabs' ? '#fff' : 'var(--text-muted)', fontWeight: 700, transition: '0.2s', fontSize: 13 }}>Cabs</button>
        <button onClick={() => setTab('bookings')} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: tab === 'bookings' ? 'var(--primary)' : 'transparent', color: tab === 'bookings' ? '#fff' : 'var(--text-muted)', fontWeight: 700, transition: '0.2s', fontSize: 13 }}>Bookings</button>
        <button onClick={() => setTab('offers')} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: tab === 'offers' ? 'var(--primary)' : 'transparent', color: tab === 'offers' ? '#fff' : 'var(--text-muted)', fontWeight: 700, transition: '0.2s', fontSize: 13 }}>Offers</button>
      </div>

      {tab === 'travellers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Manage Rides</h3>
            <button className="btn btn-primary" style={{ width: 'auto', height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => setIsAdding(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Add Ride
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search rides by operator or city..." 
              style={{ width: '100%', paddingLeft: 40 }}
              value={searchRide}
              onChange={(e) => setSearchRide(e.target.value)}
            />
          </div>
          
          {tLoad ? <div className="skeleton" style={{ height: 100 }} /> : filteredTravellers.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active rides found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredTravellers.map(t => (
                <div key={t.id} className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800 }}>{t.operator_name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <MapPin size={12} /> {t.from_city} → {t.to_city}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(t.price)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t.available_seats}/{t.total_seats} Seats</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Departure</p>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{formatDate(t.departure_time)} • {formatTime(t.departure_time)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-outline" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => setEditingRide(t)}>
                      <Edit2 size={14} style={{ marginRight: 4 }} /> Edit
                    </button>
                    <button className="btn" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12, background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }} onClick={() => { if(window.confirm('Delete this ride?')) deleteMut.mutate(t.id); }}>
                      <Trash2 size={14} style={{ marginRight: 4 }} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'cabs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Manage Cabs</h3>
            <button className="btn btn-primary" style={{ width: 'auto', height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => setIsAddingCab(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Add Cab
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input type="text" className="input-field" placeholder="Search by name or type..." style={{ width: '100%', paddingLeft: 40 }} value={searchCab} onChange={e => setSearchCab(e.target.value)} />
          </div>

          {cabLoad ? <div className="skeleton" style={{ height: 100 }} /> : filteredCabs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No cabs found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredCabs.map(c => (
                <div key={c.id} className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)', opacity: c.is_active === false ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {c.image_url ? (
                        <img src={c.image_url} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 8 }} alt={c.name} />
                      ) : (
                        <div style={{ width: 56, height: 40, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Car size={20} color="var(--primary)" />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{c.type} • {c.capacity} seats</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>₹{c.fare}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ETA {c.eta_minutes} min</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Driver: {c.driver?.name} • ⭐ {c.driver?.rating}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-outline" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => setEditingCab(c)}>
                      <Edit2 size={14} style={{ marginRight: 4 }} /> Edit
                    </button>
                    <button className="btn" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12, background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }} onClick={() => { if (window.confirm('Remove this cab?')) deleteCabMut.mutate(c.id); }}>
                      <Trash2 size={14} style={{ marginRight: 4 }} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Recent Bookings</h3>
          
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search bookings by REF or name..." 
              style={{ width: '100%', paddingLeft: 40 }}
              value={searchBooking}
              onChange={(e) => setSearchBooking(e.target.value)}
            />
          </div>

          {bLoad ? <div className="skeleton" style={{ height: 100 }} /> : filteredBookings.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No bookings found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredBookings.map(b => (
                <div key={b.id} className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REF: {b.booking_ref}</p>
                      <h4 style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{b.user.name || b.user.phone}</h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge" style={{ background: b.status === 'confirmed' ? 'var(--success-bg)' : 'var(--bg)', color: b.status === 'confirmed' ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {b.ride.from_city} → {b.ride.to_city}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatDate(b.ride.departure_time)} • {formatTime(b.ride.departure_time)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>Seats: {b.seat_numbers.join(', ')}</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(b.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'offers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Promos & Coupons</h3>
            <button className="btn btn-primary" style={{ width: 'auto', height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => setIsAddingCoupon(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Add Coupon
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search coupons by code..." 
              style={{ width: '100%', paddingLeft: 40 }}
              value={searchCoupon}
              onChange={(e) => setSearchCoupon(e.target.value)}
            />
          </div>

          {cLoad ? <div className="skeleton" style={{ height: 100 }} /> : filteredCoupons.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No coupons found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredCoupons.map(c => (
                <div key={c.id} className="card" style={{ padding: 16, border: 'none', boxShadow: 'var(--shadow-sm)', opacity: c.is_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tag size={20} color="var(--primary)" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800 }}>{c.code}</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Save {formatCurrency(c.discount_amount)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => setEditingCoupon(c)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn" style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 12, background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }} onClick={() => { if(window.confirm('Delete this coupon?')) deleteCouponMut.mutate(c.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAdding && (
        <Modal title="Add New Ride" onClose={() => setIsAdding(false)}>
          <TravellerForm onSubmit={d => createMut.mutate(d)} onCancel={() => setIsAdding(false)} isLoading={createMut.isPending} />
        </Modal>
      )}

      {isAddingCoupon && (
        <Modal title="Add Coupon" onClose={() => setIsAddingCoupon(false)}>
          <CouponForm onSubmit={d => createCouponMut.mutate(d)} onCancel={() => setIsAddingCoupon(false)} isLoading={createCouponMut.isPending} />
        </Modal>
      )}

      {editingCoupon && (
        <Modal title="Edit Coupon" onClose={() => setEditingCoupon(null)}>
          <CouponForm initialData={editingCoupon} onSubmit={d => updateCouponMut.mutate({id: editingCoupon.id, data: d})} onCancel={() => setEditingCoupon(null)} isLoading={updateCouponMut.isPending} />
        </Modal>
      )}

      {editingRide && (
        <Modal title="Edit Ride" onClose={() => setEditingRide(null)}>
          <TravellerForm initialData={editingRide} onSubmit={d => updateMut.mutate({id: editingRide.id, data: d})} onCancel={() => setEditingRide(null)} isLoading={updateMut.isPending} />
        </Modal>
      )}

      {isAddingCab && (
        <Modal title="Add New Cab" onClose={() => setIsAddingCab(false)}>
          <CabForm onSubmit={d => createCabMut.mutate(d)} onCancel={() => setIsAddingCab(false)} isLoading={createCabMut.isPending} />
        </Modal>
      )}

      {editingCab && (
        <Modal title="Edit Cab" onClose={() => setEditingCab(null)}>
          <CabForm initialData={editingCab} onSubmit={d => updateCabMut.mutate({ id: editingCab.id, data: d })} onCancel={() => setEditingCab(null)} isLoading={updateCabMut.isPending} />
        </Modal>
      )}
    </div>
  );
}
