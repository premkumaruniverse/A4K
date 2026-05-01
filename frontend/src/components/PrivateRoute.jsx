import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function PrivateRoute() {
  const { token } = useAuthStore();
  return token ? <Outlet /> : <Navigate to="/home" replace />;
}
