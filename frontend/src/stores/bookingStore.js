import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const ROUTES = {
  KGP_CCU: { key: 'KGP_CCU', from: 'Kharagpur', to: 'Kolkata', label: 'Kharagpur → Kolkata' },
  CCU_KGP: { key: 'CCU_KGP', from: 'Kolkata', to: 'Kharagpur', label: 'Kolkata → Kharagpur' },
};

const useBookingStore = create(
  persist(
    (set, get) => ({
      ROUTES,

      // Step 1: Route selection
      selectedRoute: null,      // ROUTES.KGP_CCU or ROUTES.CCU_KGP
      travelDate: '',

      // Step 2: Traveller selection
      selectedTraveller: null,  // full ride object

      // Step 2b: Cab selection (alternative to traveller)
      selectedCab: null,        // cab object from /api/v1/cabs

      // Step 3: Seat selection (single seat)
      selectedSeat: null,       // { id, seat_number }

      // Final booking result
      currentBooking: null,

      // ── Actions ──────────────────────────────────────────────────────
      setRoute: (routeKey) => set({ selectedRoute: ROUTES[routeKey] || null }),
      setDate: (date) => set({ travelDate: date }),
      setTraveller: (ride) => set({ selectedTraveller: ride, selectedSeat: null, selectedCab: null }),
      setCab: (cab) => set({ selectedCab: cab, selectedTraveller: null, selectedSeat: null }),
      setSeat: (seat) => set({ selectedSeat: seat }),
      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      reset: () => set({
        selectedTraveller: null,
        selectedCab: null,
        selectedSeat: null,
        currentBooking: null,
      }),

      fullReset: () => set({
        selectedRoute: null,
        travelDate: '',
        selectedTraveller: null,
        selectedCab: null,
        selectedSeat: null,
        currentBooking: null,
      }),
    }),
    {
      name: 'booking-store',
      partialize: (state) => ({
        selectedRoute: state.selectedRoute,
        travelDate: state.travelDate,
        currentBooking: state.currentBooking,
      }),
    }
  )
);

export { ROUTES };
export default useBookingStore;
