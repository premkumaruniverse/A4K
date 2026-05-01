import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function BackHeader({ title, onBack, rightEl }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header className="back-header">
      <button className="back-btn" onClick={handleBack} aria-label="Go back">
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <h1 className="back-header-title" style={{ flex: 1 }}>{title}</h1>
      {rightEl && <div>{rightEl}</div>}
    </header>
  );
}
