import { useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Zap, Wind, Wifi, Usb, Droplets, Bed, ArrowRight } from 'lucide-react';
import { formatTime, formatDuration, formatCurrency, vehicleLabel } from '../utils/helpers';

const AMENITY_ICONS = {
  'AC': Wind,
  'WiFi': Wifi,
  'USB Charging': Usb,
  'Water Bottle': Droplets,
  'Blanket': Bed,
  'Pillow': Bed,
  'Music': Zap,
};

function AmenityTag({ name }) {
  const Icon = AMENITY_ICONS[name] || Zap;
  return (
    <span className="amenity-tag">
      <Icon size={12} strokeWidth={2.5} />
      {name}
    </span>
  );
}

export default function RideCard({ ride }) {
  const navigate = useNavigate();

  return (
    <div
      className="card fade-up"
      style={{ 
        marginBottom: 16, 
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease'
      }}
      onClick={() => navigate(`/ride/${ride.id}`)}
      onActive={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
    >
      {/* Top Banner for Operator */}
      <div style={{ 
        padding: '16px 20px', 
        background: 'var(--primary-light)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, background: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)'
          }}>
            <Zap size={18} color="var(--primary)" fill="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{ride.operator_name}</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>{vehicleLabel(ride.type)}</span>
          </div>
        </div>
        <div className="star-row" style={{ background: '#fff', padding: '4px 8px', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Star size={14} fill="#F59E0B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ride.rating}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{formatTime(ride.departure_time)}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{ride.from_city}</p>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{formatDuration(ride.departure_time, ride.arrival_time)}</p>
            <div style={{ width: '100%', height: 2, background: 'var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--border)' }} />
              <div style={{ position: 'absolute', right: 0, top: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{formatTime(ride.arrival_time)}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{ride.to_city}</p>
          </div>
        </div>

        {/* Footer info: Amenities & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--bg)', paddingTop: 16 }}>
          <div style={{ flex: 1 }}>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {ride.amenities?.slice(0, 3).map((a) => <AmenityTag key={a} name={a} />)}
                {ride.amenities?.length > 3 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px' }}>+{ride.amenities.length - 3} move</span>}
             </div>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: ride.available_seats < 5 ? 'var(--danger)' : 'var(--success)', fontSize: 14, fontWeight: 800, background: ride.available_seats < 5 ? '#fef2f2' : '#f0fdf4', padding: '6px 10px', borderRadius: 8, marginTop: 8 }}>
                <Users size={16} />
                <span>{ride.available_seats} Available Seats</span>
             </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Price Starting From</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: -4 }}>{formatCurrency(ride.price)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
