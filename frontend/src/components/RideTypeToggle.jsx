import { Truck, Car } from 'lucide-react';

export default function RideTypeToggle({ mode, onModeChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 0,
      background: 'var(--bg)',
      borderRadius: 14,
      padding: 4,
      border: '1.5px solid var(--border)',
    }}>
      {[
        { value: 'shuttle', icon: <Truck size={18} />, label: 'Shuttle' },
        { value: 'cab',     icon: <Car  size={18} />, label: 'Cab' },
      ].map(({ value, icon, label }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 11,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              transition: 'all 0.2s ease',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              boxShadow: active ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
            }}
          >
            {icon}{label}
          </button>
        );
      })}
    </div>
  );
}
