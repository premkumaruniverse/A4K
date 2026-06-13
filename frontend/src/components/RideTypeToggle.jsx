import { Truck, Car } from 'lucide-react';

export default function RideTypeToggle({ mode, onModeChange }) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg)',
      borderRadius: 10,
      padding: 3,
      border: '1px solid var(--border)',
      gap: 2,
    }}>
      {[
        { value: 'shuttle', icon: <Truck size={14} />, label: 'Shuttle' },
        { value: 'cab',     icon: <Car  size={14} />, label: 'Cab' },
      ].map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            transition: 'all 0.15s',
            background: mode === value ? 'var(--primary)' : 'transparent',
            color:      mode === value ? '#fff'           : 'var(--text-muted)',
          }}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  );
}
