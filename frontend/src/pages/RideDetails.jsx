import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, MapPin, Zap, Wind, Wifi, Usb, Droplets, ArrowLeft, ShieldCheck, ChevronRight, Share2 } from 'lucide-react';
import { ridesAPI } from '../services/api';
import useBookingStore from '../stores/bookingStore';
import { formatTime, formatDate, formatDuration, formatCurrency } from '../utils/helpers';

const AMENITY_ICONS = {
  'AC': Wind,
  'WiFi': Wifi,
  'USB Charging': Usb,
  'Water Bottle': Droplets
};

const REVIEWS = [
  { name: 'Raj Sharma', rating: 5, comment: 'Excellent service! Very comfortable journey. The bus was on time and clean.', date: '2 days ago' },
  { name: 'Priya M.', rating: 4, comment: 'Good ride, punctual and clean bus. The staff was polite.', date: '5 days ago' },
];

export default function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSelectedRide, setNumPassengers } = useBookingStore();

  const { data: ride, isLoading, isError } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => ridesAPI.getDetail(id).then((r) => r.data),
  });

  const handleBook = () => {
    setSelectedRide(ride);
    if (ride.type === 'bus') {
      navigate('/seat-selection');
    } else {
      setNumPassengers(1);
      navigate('/passengers');
    }
  };

  if (isLoading) return (
    <div className="page" style={{ padding: 20 }}>
       <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 20 }} />
       <div className="skeleton" style={{ height: 200, borderRadius: 20, marginBottom: 20 }} />
       <div className="skeleton" style={{ height: 150, borderRadius: 20, marginBottom: 20 }} />
    </div>
  );

  if (isError || !ride) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Zap size={40} color="var(--danger)" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Ride Not Found</h2>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Premium Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--bg)', border: 'none', padding: 10, borderRadius: 12, cursor: 'pointer' }}>
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>{ride.type.charAt(0).toUpperCase() + ride.type.slice(1)} Details</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <Share2 size={20} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Operator Card */}
      <div className="section fade-up">
        <div className="card" style={{ padding: 24, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} color="var(--primary)" fill="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{ride.operator_name}</h2>
                <span className="badge badge-primary">{ride.type}</span>
              </div>
            </div>
            <div className="star-row" style={{ background: 'var(--bg)', padding: '6px 10px', borderRadius: 10 }}>
              <Star size={16} fill="#F59E0B" />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{ride.rating}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Reviews</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{ride.total_reviews} Passengers</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Safety</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                <ShieldCheck size={14} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Verified Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="section" style={{ paddingTop: 0 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, marginLeft: 4 }}>Journey Timeline</h3>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 20 }}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '3px solid var(--primary)', background: '#fff' }} />
                <div style={{ flex: 1, width: 2, background: 'linear-gradient(to bottom, var(--primary), var(--success))', margin: '4px 0' }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '3px solid var(--success)', background: '#fff' }} />
             </div>
             
             <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 18, fontWeight: 800 }}>{formatTime(ride.departure_time)}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(ride.departure_time)}</p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{ride.from_city}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Pick-up from main terminal</p>
                </div>

                <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', padding: '4px 10px', borderRadius: 20 }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatDuration(ride.departure_time, ride.arrival_time)}</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 18, fontWeight: 800 }}>{formatTime(ride.arrival_time)}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(ride.arrival_time)}</p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{ride.to_city}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Drop-off at center square</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Amenities Grid */}
      <div className="section" style={{ paddingTop: 0 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, marginLeft: 4 }}>Amenities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ride.amenities?.map((a) => {
            const Icon = AMENITY_ICONS[a] || Zap;
            return (
              <div key={a} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--primary)" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="section" style={{ paddingTop: 0, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginLeft: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Passenger Reviews</h3>
          <button style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700, border: 'none', background: 'none' }}>View All</button>
        </div>
        {REVIEWS.map((rev, i) => (
          <div key={i} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{rev.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rev.date}</p>
                </div>
              </div>
              <div className="star-row">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={12} fill={j < rev.rating ? "#F59E0B" : "var(--border)"} color={j < rev.rating ? "#F59E0B" : "var(--border)"} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{rev.comment}"</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA Bar */}
      <div className="bottom-cta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>Starting from</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(ride.price)} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>/ seat</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: ride.available_seats < 5 ? 'var(--danger)' : 'var(--success)' }}>
              {ride.available_seats} Seats left
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleBook} style={{ height: 56, fontSize: 16 }}>
          {ride.type === 'bus' ? 'Select Seats' : 'Continue to Passenger Details'}
        </button>
      </div>
    </div>
  );
}
