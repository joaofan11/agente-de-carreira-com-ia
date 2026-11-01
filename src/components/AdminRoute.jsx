import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
export default function AdminRoute(){const {user,isLoadingAuth}=useAuth();if(isLoadingAuth)return null;return user?.role==='admin'?<Outlet/>:<Navigate to="/dashboard" replace/>;}
