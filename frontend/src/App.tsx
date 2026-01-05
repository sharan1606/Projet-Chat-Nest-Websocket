import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChatPage } from './pages/ChatPage';
import type { ReactNode } from 'react';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  return !token ? <>{children}</> : <Navigate to="/chat" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/chat" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
