import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Attach JWT on every request ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Handle 401 globally ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.replace('/');
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  sendOTP:       (phone)        => api.post('/auth/send-otp', { phone }),
  verifyOTP:     (phone, otp)   => api.post('/auth/verify-otp', { phone, otp }),
  getProfile:    ()             => api.get('/auth/me'),
  updateProfile: (data)         => api.put('/auth/me', data),
};

// ── Travellers (fixed-route rides) ──────────────────────────────────────────
export const travellerAPI = {
  getRoutes:    ()              => api.get('/rides/routes'),
  search:       (params)        => api.get('/rides', {
    params: { from: params.from, to: params.to, date: params.date },
  }),
  getDetail:    (id)            => api.get(`/rides/${id}`),
  lockSeat:     (data)          => api.post('/bookings/lock-seat', data),
  releaseSeat:  (seatId)        => api.delete(`/bookings/release-seat/${seatId}`),
};

// ── Bookings ────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create:        (data) => api.post('/bookings', data),
  getMyBookings: ()     => api.get('/bookings/me'),
  getBooking:    (id)   => api.get(`/bookings/${id}`),
  cancel:        (id)   => api.patch(`/bookings/${id}/cancel`),
};

// ── Payment ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  init:   (data) => api.post('/payment/init', data),
  verify: (data) => api.post('/payment/verify', data),
};

// ── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getTravellers:     ()       => api.get('/admin/travellers'),
  createTraveller:   (data)   => api.post('/admin/travellers', data),
  updateTraveller:   (id, d)  => api.put(`/admin/travellers/${id}`, d),
  deleteTraveller:   (id)     => api.delete(`/admin/travellers/${id}`),
  getBookings:       ()       => api.get('/admin/bookings'),
  promoteAdmin:      (phone)  => api.post(`/admin/promote/${phone}`),
};

export default api;
