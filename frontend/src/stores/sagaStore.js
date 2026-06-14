import { create } from 'zustand';
import { travellerAPI, bookingsAPI, paymentAPI } from '../services/api';

/**
 * Frontend Saga Orchestrator
 *
 * Saga States:
 *   IDLE → SEAT_LOCKING → SEAT_LOCKED → AUTH_REQUIRED → AUTHENTICATING
 *   → AUTH_DONE → PAYMENT_INIT → PAYMENT_VERIFY → CONFIRMED
 *   → ROLLBACK (any failure)
 *
 * Compensation:
 *   On any step failure or user cancellation → release seat → IDLE
 */

const useSagaStore = create((set, get) => ({
  sagaState: 'IDLE',
  lockedSeat: null,      // { seat_id, seat_number, expires_at, lock_duration_seconds }
  bookingId: null,
  paymentId: null,
  paymentMethod: 'upi',
  error: null,
  lockExpiresAt: null,   // ISO timestamp

  // ── Step 1: Lock seat (public, before auth) ────────────────────────
  lockSeat: async (seatId, rideId) => {
    set({ sagaState: 'SEAT_LOCKING', error: null });
    try {
      const res = await travellerAPI.lockSeat({ seat_id: seatId, ride_id: rideId });
      const data = res.data;
      set({
        sagaState: 'SEAT_LOCKED',
        lockedSeat: {
          seat_id: data.seat_id,
          seat_number: data.seat_number,
          ride_id: rideId,
        },
        lockExpiresAt: new Date(Date.now() + data.lock_duration_seconds * 1000).toISOString(),
      });
      return true;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Seat is no longer available';
      set({ sagaState: 'IDLE', error: msg });
      return false;
    }
  },

  // ── Require auth (transition after seat lock if not logged in) ─────
  requireAuth: () => {
    const { sagaState } = get();
    if (sagaState !== 'SEAT_LOCKED') return;
    set({ sagaState: 'AUTH_REQUIRED' });
  },

  // ── Auth done (called by InlineAuth on OTP verify success) ────────
  authDone: () => {
    set({ sagaState: 'AUTH_DONE' });
  },

  // ── Set payment method ─────────────────────────────────────────────
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  // ── Step 2: Create booking + init payment ─────────────────────────
  initPayment: async (rideId, userName, cabParams = null) => {
    const { lockedSeat, paymentMethod } = get();
    if (!cabParams && !lockedSeat) return false;

    set({ sagaState: 'PAYMENT_INIT', error: null });
    try {
      let bookingRes;
      if (cabParams) {
        // Create cab booking
        bookingRes = await bookingsAPI.create({
          cab_id: cabParams.cab_id,
          from_city: cabParams.from_city,
          to_city: cabParams.to_city,
          passengers: [{ name: userName || 'Traveller', age: 25, gender: 'other' }],
          payment_method: paymentMethod,
        });
      } else {
        // Create standard booking
        bookingRes = await bookingsAPI.create({
          ride_id: rideId,
          seat_ids: [lockedSeat.seat_id],
          passengers: [{ name: userName || 'Traveller', age: 25, gender: 'other' }],
          payment_method: paymentMethod,
        });
      }
      const booking = bookingRes.data;
      set({ bookingId: booking.id });

      // Init payment
      const initRes = await paymentAPI.init({ booking_id: booking.id, payment_method: paymentMethod });
      set({ paymentId: initRes.data.payment_id, sagaState: 'PAYMENT_VERIFY' });

      return booking;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to initiate payment';
      set({ error: msg });
      // Rollback
      await get().rollback();
      return false;
    }
  },

  // ── Step 3: Verify payment ─────────────────────────────────────────
  verifyPayment: async () => {
    const { paymentId, bookingId } = get();
    set({ sagaState: 'PAYMENT_VERIFY', error: null });
    try {
      await paymentAPI.verify({ payment_id: paymentId, booking_id: bookingId });

      // Fetch confirmed booking
      const confirmedRes = await bookingsAPI.getBooking(bookingId);
      set({ sagaState: 'CONFIRMED' });
      return confirmedRes.data;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Payment verification failed';
      set({ error: msg });
      await get().rollback();
      return false;
    }
  },

  // ── Compensation: Release seat ─────────────────────────────────────
  rollback: async () => {
    const { lockedSeat } = get();
    // Clear state immediately for UI responsiveness
    set({
      sagaState: 'IDLE',
      lockedSeat: null,
      bookingId: null,
      paymentId: null,
      lockExpiresAt: null,
      error: null,
    });

    if (lockedSeat?.seat_id) {
      try {
        await travellerAPI.releaseSeat(lockedSeat.seat_id);
      } catch (_) {
        // best-effort cleanup
      }
    }
  },

  // ── Reset after confirmed ──────────────────────────────────────────
  resetSaga: () => set({
    sagaState: 'IDLE',
    lockedSeat: null,
    bookingId: null,
    paymentId: null,
    lockExpiresAt: null,
    error: null,
  }),

  clearError: () => set({ error: null }),
}));

export default useSagaStore;
