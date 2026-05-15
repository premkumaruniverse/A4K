import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Calendar, Clock, Star, ArrowLeft } from 'lucide-react';
import BackHeader from '../components/BackHeader';
import RideCard from '../components/RideCard';
import { ridesAPI } from '../services/api';
import useBookingStore from '../stores/bookingStore';
import { formatDateShort } from '../utils/helpers';

const FILTERS = ['Departure', 'Price', 'Rating'];

function sortRides(rides, filter) {
  const r = [...rides];
  if (filter === 'Price')     return r.sort((a, b) => a.price - b.price);
  if (filter === 'Departure') return r.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
  if (filter === 'Rating')    return r.sort((a, b) => b.rating - a.rating);
  return r;
}

export default function SearchResults() {
  const navigate = useNavigate();
  const { selectedRoute, travelDate } = useBookingStore();
  const [activeFilter, setFilter] = useState('Departure');

  const from = selectedRoute?.from || 'Kharagpur';
  const to = selectedRoute?.to || 'Kolkata Airport';
  const date = travelDate || new Date().toISOString().split('T')[0];
  const type = 'traveller';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rides', from, to, date, type],
    queryFn: () => ridesAPI.search({ from, to, date, type }).then((r) => r.data),
    enabled: !!from && !!to,
    staleTime: 60000,
  });

  const rawRides = data || [];
  const rides = sortRides(rawRides, activeFilter);

  return (
    <div className="page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
          borderBottom: '1.5px solid var(--border)' 
        }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={24} color="var(--text-primary)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {from} → {to}
              </h2>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
              {date ? formatDateShort(date + 'T00:00:00') : 'All dates'} • {type.charAt(0).toUpperCase() + type.slice(1)}
            </p>
          </div>
          <button style={{ 
            width: 40, height: 40, borderRadius: 10, background: 'var(--bg)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' 
          }}>
            <SlidersHorizontal size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Filter Row */}
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'Departure' && <Clock size={14} style={{ marginRight: 6, display: 'inline' }} />}
              {f === 'Price' && <span style={{ marginRight: 6, display: 'inline' }}>₹</span>}
              {f === 'Rating' && <Star size={14} style={{ marginRight: 6, display: 'inline' }} />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      <div style={{ padding: '4px 16px 40px' }}>
        {isLoading ? (
          <div style={{ padding: '60px 0' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />
            ))}
          </div>
        ) : isError ? (
          <div className="empty-state">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Search size={32} color="var(--danger)" />
            </div>
            <h3 className="empty-state-title">Something went wrong</h3>
            <p className="empty-state-sub">We couldn't load the rides. Please try again later.</p>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => window.location.reload()}>
              Retry Now
            </button>
          </div>
        ) : rides.length === 0 ? (
          <div className="empty-state">
             <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Bus size={40} color="var(--primary)" />
            </div>
            <h3 className="empty-state-title">No rides available</h3>
            <p className="empty-state-sub">
              Sorry, we couldn't find any {type} rides from <strong>{from}</strong> to <strong>{to}</strong> on this date.
            </p>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate(-1)}>
              Change Search
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, marginLeft: 4 }}>
              {rides.length} {rides.length === 1 ? 'ride' : 'rides'} found
            </p>
            {rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
          </div>
        )}
      </div>
    </div>
  );
}
