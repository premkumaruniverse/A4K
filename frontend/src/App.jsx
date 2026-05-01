import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Splash        from './pages/Splash';
import Home          from './pages/Home';
import TravellerList from './pages/TravellerList';
import SeatSelection from './pages/SeatSelection';
import Payment       from './pages/Payment';
import Confirmation  from './pages/Confirmation';
import MyBookings    from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile       from './pages/Profile';
import AdminPanel    from './pages/AdminPanel';
import ProtectedRoute from './components/PrivateRoute';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Splash />} />
          <Route path="/home"        element={<Home />} />
          <Route path="/travellers"  element={<TravellerList />} />
          <Route path="/seats/:id"   element={<SeatSelection />} />
          <Route path="/payment"     element={<Payment />} />
          <Route path="/confirmation" element={<Confirmation />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/bookings"      element={<MyBookings />} />
            <Route path="/bookings/:id"  element={<BookingDetail />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="/admin"         element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: 14, fontSize: 14, maxWidth: 380, fontWeight: 600 },
          success: { duration: 3000 },
          error:   { duration: 4500 },
        }}
      />
    </QueryClientProvider>
  );
}
