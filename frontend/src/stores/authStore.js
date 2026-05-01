import { create } from 'zustand';

const getStored = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user:  getStored('user'),

  get isAdmin() {
    return getStored('user')?.is_admin === true;
  },

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
