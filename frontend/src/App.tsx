import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ContentListPage } from './pages/ContentListPage';
import { CreateContentPage } from './pages/CreateContentPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { AIRunsPage } from './pages/AIRunsPage';
import { TokensPage } from './pages/TokensPage';
import { ToastProvider } from './components/ui/Toast';
import { useAuthStore } from './store';
import { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token } = useAuthStore();
  return token ? <Navigate to="/content" replace /> : <>{children}</>;
}

function ProtectedLayout() {
  return (
    <ToastProvider>
      <Layout />
    </ToastProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<PrivateRoute><ProtectedLayout /></PrivateRoute>}>
        <Route path="/content" element={<ContentListPage />} />
        <Route path="/content/new" element={<CreateContentPage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/ai-runs" element={<AIRunsPage />} />
        <Route path="/tokens" element={<TokensPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/content" replace />} />
      <Route path="*" element={<Navigate to="/content" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}