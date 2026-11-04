import AdminRoute from '@/components/AdminRoute';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import MeuPerfil from '@/pages/MeuPerfil';
import Documentos from '@/pages/Documentos';
import PreferenciasVagas from '@/pages/PreferenciasVagas';
import Oportunidades from '@/pages/Oportunidades';
import Curriculos from '@/pages/Curriculos';
import Candidaturas from '@/pages/Candidaturas';
import Configuracoes from '@/pages/Configuracoes';
import Administracao from '@/pages/Administracao';
import Demonstracao from '@/pages/Demonstracao';
import Privacidade from '@/pages/Privacidade';
import RelatorioAuditoria from '@/pages/RelatorioAuditoria';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<MeuPerfil />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/preferencias" element={<PreferenciasVagas />} />
          <Route path="/oportunidades" element={<Oportunidades />} />
          <Route path="/curriculos" element={<Curriculos />} />
          <Route path="/candidaturas" element={<Candidaturas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route element={<AdminRoute />}><Route path="/admin" element={<Administracao />} />
          <Route path="/auditoria" element={<RelatorioAuditoria />} />
          <Route path="/demo" element={<Demonstracao />} /></Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/privacidade" element={
              <main className="mx-auto max-w-4xl px-4 py-8">
                <Privacidade />
                <Link to="/" className="mt-6 inline-block text-primary underline">Voltar ao início</Link>
              </main>
            } />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
