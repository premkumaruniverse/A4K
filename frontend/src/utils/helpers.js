import { format, parseISO, differenceInMinutes } from 'date-fns';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) => {
  try { return format(parseISO(dateStr), 'dd MMM yyyy'); } catch { return dateStr; }
};

export const formatTime = (dateStr) => {
  try { return format(parseISO(dateStr), 'hh:mm a'); } catch { return dateStr; }
};

export const formatDuration = (depStr, arrStr) => {
  try {
    const dep = parseISO(depStr);
    const arr = parseISO(arrStr);
    const mins = differenceInMinutes(arr, dep);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch { return '—'; }
};

export const formatDateShort = (dateStr) => {
  try { return format(parseISO(dateStr), 'dd MMM'); } catch { return dateStr; }
};

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export const vehicleLabel = (type) => {
  const map = { bus: 'Bus', cab: 'Cab', auto: 'Auto', traveller: 'Traveller' };
  return map[type] || type;
};

export const getErrorMessage = (err) =>
  err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.';
